using InvoiceApp.Api.Data;
using InvoiceApp.Api.Domain;
using InvoiceApp.Api.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Services;

public class InvoiceNotifier(IHubContext<InvoiceHub> hub, AppDbContext db)
{
    public const string InvoiceUpdated = "InvoiceUpdated";

    /// <summary>
    /// Tells Finance, the assigned courier and (once delivered) the client that an invoice changed.
    /// Each recipient only hears about invoices they are allowed to see.
    /// </summary>
    public async Task InvoiceChangedAsync(Invoice invoice, CancellationToken ct)
    {
        var groups = new List<string> { InvoiceHub.FinanceGroup };

        if (invoice.CourierId is int courierId)
            groups.Add(InvoiceHub.UserGroup(courierId));

        if (invoice.Status >= InvoiceStatus.Delivered)
        {
            var clientUserId = await db.Users
                .Where(u => u.ClientId == invoice.ClientId)
                .Select(u => (int?)u.Id)
                .FirstOrDefaultAsync(ct);
            if (clientUserId is int id) groups.Add(InvoiceHub.UserGroup(id));
        }

        await hub.Clients.Groups(groups).SendAsync(InvoiceUpdated,
            new { invoice.Id, Status = invoice.Status.ToString() }, ct);
    }
}
