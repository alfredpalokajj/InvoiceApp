using System.Net;
using System.Net.Http.Json;
using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Domain;

namespace InvoiceApp.Tests;

public class InvoiceLifecycleTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Invoice_moves_through_every_status_to_paid()
    {
        var s = await factory.CreateScenarioAsync();
        var created = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id, 250.50m);
        Assert.Equal(InvoiceStatus.Created, created.Status);
        Assert.Matches(@"^FAT-\d{4}-\d{4}$", created.Number);

        var ready = await (await s.Finance.MarkReadyAsync(created.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();
        Assert.Equal(InvoiceStatus.ReadyForDelivery, ready.Status);
        Assert.Equal(s.CourierAInfo.Id, ready.Courier!.Id);
        Assert.NotNull(ready.ReadyAt);

        var started = await (await s.CourierA.ActionAsync(created.Id, "start")).ReadAsync<InvoiceDto>();
        Assert.Equal(InvoiceStatus.InTransit, started.Status);
        Assert.NotNull(started.StartedAt);

        var delivered = await (await s.CourierA.ActionAsync(created.Id, "deliver")).ReadAsync<InvoiceDto>();
        Assert.Equal(InvoiceStatus.Delivered, delivered.Status);
        Assert.NotNull(delivered.DeliveredAt);

        var paid = await (await s.ClientX.ActionAsync(created.Id, "pay")).ReadAsync<InvoiceDto>();
        Assert.Equal(InvoiceStatus.Paid, paid.Status);
        Assert.NotNull(paid.PaidAt);
        Assert.Equal(250.50m, paid.Amount);

        // Finance sees the final status too.
        var financeView = await (await s.Finance.GetAsync($"/api/invoices/{created.Id}")).ReadAsync<InvoiceDto>();
        Assert.Equal(InvoiceStatus.Paid, financeView.Status);
    }

    [Fact]
    public async Task Out_of_order_transitions_return_409()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);
        await (await s.Finance.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();

        // Ready for delivery: can't be marked ready again, delivered before starting, or edited.
        await AssertConflict(s.Finance.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id), "invalid_transition");
        await AssertConflict(s.CourierA.ActionAsync(invoice.Id, "deliver"), "invalid_transition");
        await AssertConflict(s.Finance.PutAsJsonAsync($"/api/invoices/{invoice.Id}", new SaveInvoiceRequest(
            s.ClientXInfo.Id, 1m, "EUR", "x", null, DateOnly.FromDateTime(DateTime.UtcNow))), "not_editable");

        // In transit: can't be started twice.
        await (await s.CourierA.ActionAsync(invoice.Id, "start")).ReadAsync<InvoiceDto>();
        await AssertConflict(s.CourierA.ActionAsync(invoice.Id, "start"), "invalid_transition");

        // Delivered, then paid: can't be paid twice or delivered again.
        await (await s.CourierA.ActionAsync(invoice.Id, "deliver")).ReadAsync<InvoiceDto>();
        await (await s.ClientX.ActionAsync(invoice.Id, "pay")).ReadAsync<InvoiceDto>();
        await AssertConflict(s.ClientX.ActionAsync(invoice.Id, "pay"), "invalid_transition");
        await AssertConflict(s.CourierA.ActionAsync(invoice.Id, "deliver"), "invalid_transition");
    }

    [Fact]
    public async Task Created_invoice_can_be_edited_and_numbers_increment()
    {
        var s = await factory.CreateScenarioAsync();
        var first = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);
        var second = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);
        Assert.Equal(int.Parse(first.Number[^4..]) + 1, int.Parse(second.Number[^4..]));

        var due = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10));
        var res = await s.Finance.PutAsJsonAsync($"/api/invoices/{first.Id}",
            new SaveInvoiceRequest(s.ClientYInfo.Id, 999.99m, "eur", "Updated", null, due));
        var updated = await res.ReadAsync<InvoiceDto>();
        Assert.Equal(s.ClientYInfo.Id, updated.Client.Id);
        Assert.Equal(999.99m, updated.Amount);
        Assert.Equal("EUR", updated.Currency);
        Assert.Equal(due, updated.DueDate);
    }

    [Fact]
    public async Task Invoices_created_at_the_same_time_all_get_different_numbers()
    {
        var s = await factory.CreateScenarioAsync();
        var due = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));

        var responses = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ =>
            s.Finance.PostAsJsonAsync("/api/invoices",
                new SaveInvoiceRequest(s.ClientXInfo.Id, 10m, "EUR", "Concurrent", null, due))));

        var invoices = new List<InvoiceDto>();
        foreach (var res in responses) invoices.Add(await res.ReadAsync<InvoiceDto>(HttpStatusCode.Created));
        Assert.Equal(invoices.Count, invoices.Select(i => i.Number).Distinct().Count());
    }

    [Fact]
    public async Task Marking_ready_requires_a_real_courier()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);

        var notACourier = await s.Finance.MarkReadyAsync(invoice.Id, s.ClientXInfo.Id + 100_000);
        Assert.Equal(HttpStatusCode.BadRequest, notACourier.StatusCode);
        Assert.Equal("invalid_courier", await notACourier.ErrorCodeAsync());
    }

    [Fact]
    public async Task Invalid_invoice_input_returns_400()
    {
        var s = await factory.CreateScenarioAsync();
        var res = await s.Finance.PostAsJsonAsync("/api/invoices", new { clientId = 0, amount = -5 });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    private static async Task AssertConflict(Task<HttpResponseMessage> call, string code)
    {
        var res = await call;
        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
        Assert.Equal(code, await res.ErrorCodeAsync());
    }
}
