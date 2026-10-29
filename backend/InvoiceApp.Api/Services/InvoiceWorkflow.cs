using System.Data;
using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Data;
using InvoiceApp.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Services;

/// <summary>
/// All invoice writes: creation, edits and the status lifecycle
/// Created → ReadyForDelivery → InTransit → Delivered → Paid.
/// </summary>
public class InvoiceWorkflow(AppDbContext db, InvoiceNotifier notifier, TimeProvider clock)
{
    public async Task<Invoice> CreateAsync(SaveInvoiceRequest req, CurrentUser user, CancellationToken ct)
    {
        RequireFinance(user);
        await EnsureClientExistsAsync(req.ClientId, ct);

        var now = clock.GetUtcNow().UtcDateTime;
        var issueDate = req.IssueDate ?? DateOnly.FromDateTime(now);
        var invoice = new Invoice
        {
            ClientId = req.ClientId,
            Amount = req.Amount,
            Currency = NormalizeCurrency(req.Currency),
            Details = req.Details?.Trim() ?? "",
            IssueDate = issueDate,
            DueDate = req.DueDate!.Value,
            Status = InvoiceStatus.Created,
            CreatedAt = now
        };
        db.Invoices.Add(invoice);
        // Numbers are "last + 1", so reading the last one and inserting must be a single step, or invoices created
        // at the same moment pick the same number. On SQLite a Serializable transaction starts with BEGIN IMMEDIATE:
        // it takes the write lock before the read, so concurrent creates wait their turn here.
        await using (var tx = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct))
        {
            invoice.Number = await NextNumberAsync(issueDate.Year, ct);
            await db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        await notifier.InvoiceChangedAsync(invoice, ct);
        return invoice;
    }

    public async Task<Invoice> UpdateAsync(int id, SaveInvoiceRequest req, CurrentUser user, CancellationToken ct)
    {
        RequireFinance(user);
        var invoice = await FindVisibleAsync(id, user, ct);
        if (invoice.Status != InvoiceStatus.Created) throw Errors.NotEditable();
        await EnsureClientExistsAsync(req.ClientId, ct);

        invoice.ClientId = req.ClientId;
        invoice.Amount = req.Amount;
        invoice.Currency = NormalizeCurrency(req.Currency);
        invoice.Details = req.Details?.Trim() ?? "";
        invoice.IssueDate = req.IssueDate ?? invoice.IssueDate;
        invoice.DueDate = req.DueDate!.Value;
        await db.SaveChangesAsync(ct);
        await notifier.InvoiceChangedAsync(invoice, ct);
        return invoice;
    }

    public async Task<Invoice> MarkReadyAsync(int id, int courierId, CurrentUser user, CancellationToken ct)
    {
        RequireFinance(user);
        var courierExists = await db.Users.AnyAsync(u => u.Id == courierId && u.Role == Role.Courier, ct);
        if (!courierExists) throw Errors.InvalidCourier();

        return await TransitionAsync(id, user, InvoiceStatus.Created, InvoiceStatus.ReadyForDelivery, (i, now) =>
        {
            i.CourierId = courierId;
            i.ReadyAt = now;
        }, ct);
    }

    public Task<Invoice> StartAsync(int id, CurrentUser user, CancellationToken ct)
    {
        Require(user, Role.Courier);
        return TransitionAsync(id, user, InvoiceStatus.ReadyForDelivery, InvoiceStatus.InTransit,
            (i, now) => i.StartedAt = now, ct);
    }

    public Task<Invoice> DeliverAsync(int id, CurrentUser user, CancellationToken ct)
    {
        Require(user, Role.Courier);
        return TransitionAsync(id, user, InvoiceStatus.InTransit, InvoiceStatus.Delivered,
            (i, now) => i.DeliveredAt = now, ct);
    }

    public Task<Invoice> PayAsync(int id, CurrentUser user, CancellationToken ct)
    {
        Require(user, Role.Client);
        return TransitionAsync(id, user, InvoiceStatus.Delivered, InvoiceStatus.Paid,
            (i, now) => i.PaidAt = now, ct);
    }

    private async Task<Invoice> TransitionAsync(
        int id, CurrentUser user, InvoiceStatus from, InvoiceStatus to,
        Action<Invoice, DateTime> apply, CancellationToken ct)
    {
        // Visibility doubles as the ownership check: a courier only finds invoices assigned to them,
        // a client only finds their own.
        var invoice = await FindVisibleAsync(id, user, ct);
        if (invoice.Status != from) throw Errors.InvalidTransition(invoice.Status, to);

        invoice.Status = to;
        apply(invoice, clock.GetUtcNow().UtcDateTime);
        await db.SaveChangesAsync(ct);
        await notifier.InvoiceChangedAsync(invoice, ct);
        return invoice;
    }

    private async Task<Invoice> FindVisibleAsync(int id, CurrentUser user, CancellationToken ct) =>
        await db.Invoices.VisibleTo(user).FirstOrDefaultAsync(i => i.Id == id, ct) ?? throw Errors.NotFound();

    private async Task EnsureClientExistsAsync(int clientId, CancellationToken ct)
    {
        if (!await db.Clients.AnyAsync(c => c.Id == clientId, ct)) throw Errors.InvalidClient();
    }

    private async Task<string> NextNumberAsync(int year, CancellationToken ct)
    {
        var prefix = $"FAT-{year}-";
        var last = await db.Invoices
            .Where(i => i.Number.StartsWith(prefix))
            .OrderByDescending(i => i.Id)
            .Select(i => i.Number)
            .FirstOrDefaultAsync(ct);
        var next = last is null ? 1 : int.Parse(last[prefix.Length..]) + 1;
        return $"{prefix}{next:D4}";
    }

    private static string NormalizeCurrency(string? currency) =>
        string.IsNullOrWhiteSpace(currency) ? "EUR" : currency.Trim().ToUpperInvariant();

    private static void Require(CurrentUser user, Role role)
    {
        if (user.Role != role) throw Errors.Forbidden();
    }

    private static void RequireFinance(CurrentUser user)
    {
        if (!user.Role.HasFinanceAccess()) throw Errors.Forbidden();
    }
}
