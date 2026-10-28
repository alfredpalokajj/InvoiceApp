using System.Net;
using System.Net.Http.Json;
using InvoiceApp.Api.Contracts;

namespace InvoiceApp.Tests;

public class AccessControlTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Courier_only_sees_and_acts_on_invoices_assigned_to_them()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);

        // Not visible to anyone but Finance while still Created.
        Assert.Equal(HttpStatusCode.NotFound, (await s.CourierA.GetAsync($"/api/invoices/{invoice.Id}")).StatusCode);

        await (await s.Finance.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();

        var listA = await (await s.CourierA.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>();
        Assert.Contains(listA, i => i.Id == invoice.Id);

        var listB = await (await s.CourierB.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>();
        Assert.DoesNotContain(listB, i => i.Id == invoice.Id);
        Assert.Equal(HttpStatusCode.NotFound, (await s.CourierB.GetAsync($"/api/invoices/{invoice.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await s.CourierB.ActionAsync(invoice.Id, "start")).StatusCode);

        await (await s.CourierA.ActionAsync(invoice.Id, "start")).ReadAsync<InvoiceDto>();
        Assert.Equal(HttpStatusCode.NotFound, (await s.CourierB.ActionAsync(invoice.Id, "deliver")).StatusCode);
    }

    [Fact]
    public async Task Client_only_sees_their_own_delivered_or_paid_invoices()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);

        // Created and ReadyForDelivery are hidden from the client.
        Assert.Empty(await (await s.ClientX.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>());
        await (await s.Finance.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();
        Assert.Equal(HttpStatusCode.NotFound, (await s.ClientX.GetAsync($"/api/invoices/{invoice.Id}")).StatusCode);

        await (await s.CourierA.ActionAsync(invoice.Id, "start")).ReadAsync<InvoiceDto>();
        await (await s.CourierA.ActionAsync(invoice.Id, "deliver")).ReadAsync<InvoiceDto>();

        var listX = await (await s.ClientX.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>();
        Assert.Single(listX, i => i.Id == invoice.Id);

        // Another client can neither see nor pay it.
        Assert.Empty(await (await s.ClientY.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>());
        Assert.Equal(HttpStatusCode.NotFound, (await s.ClientY.GetAsync($"/api/invoices/{invoice.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await s.ClientY.ActionAsync(invoice.Id, "pay")).StatusCode);
    }

    [Fact]
    public async Task Non_finance_roles_cannot_use_finance_endpoints()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);

        foreach (var http in new[] { s.CourierA, s.ClientX })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await http.GetAsync("/api/clients")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await http.GetAsync("/api/couriers")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await http.PostAsJsonAsync("/api/invoices",
                new SaveInvoiceRequest(s.ClientXInfo.Id, 10m, "EUR", "", null, DateOnly.FromDateTime(DateTime.UtcNow))))
                .StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden,
                (await http.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).StatusCode);
        }

        // Couriers can't pay, clients can't start.
        Assert.Equal(HttpStatusCode.Forbidden, (await s.CourierA.ActionAsync(invoice.Id, "pay")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await s.ClientX.ActionAsync(invoice.Id, "start")).StatusCode);
    }

    [Fact]
    public async Task Anonymous_requests_are_rejected()
    {
        var http = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await http.GetAsync("/api/invoices")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await http.GetAsync("/api/clients")).StatusCode);
    }

    [Fact]
    public async Task Wrong_password_is_rejected()
    {
        var res = await factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new LoginRequest("finance@demo.com", "wrong"));
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        Assert.Equal("invalid_credentials", await res.ErrorCodeAsync());
    }

    [Fact]
    public async Task Pdf_is_served_only_to_users_who_can_see_the_invoice()
    {
        var s = await factory.CreateScenarioAsync();
        var invoice = await s.Finance.CreateInvoiceAsync(s.ClientXInfo.Id);
        await (await s.Finance.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();

        foreach (var lang in new[] { "sq", "en" })
        {
            var res = await s.Finance.GetAsync($"/api/invoices/{invoice.Id}/pdf?lang={lang}");
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            Assert.Equal("application/pdf", res.Content.Headers.ContentType?.MediaType);
            var bytes = await res.Content.ReadAsByteArrayAsync();
            Assert.Equal("%PDF"u8.ToArray(), bytes[..4]);
        }

        Assert.Equal(HttpStatusCode.OK, (await s.CourierA.GetAsync($"/api/invoices/{invoice.Id}/pdf")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await s.CourierB.GetAsync($"/api/invoices/{invoice.Id}/pdf")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await s.ClientY.GetAsync($"/api/invoices/{invoice.Id}/pdf")).StatusCode);
    }

    [Fact]
    public async Task Duplicate_email_is_rejected()
    {
        var s = await factory.CreateScenarioAsync();
        var res = await s.Finance.PostAsJsonAsync("/api/couriers",
            new CreateCourierRequest("Dup", s.ClientXInfo.Email.ToUpperInvariant(), TestApi.Password));
        Assert.Equal(HttpStatusCode.Conflict, res.StatusCode);
        Assert.Equal("email_taken", await res.ErrorCodeAsync());
    }
}
