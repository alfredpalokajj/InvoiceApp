using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;

namespace InvoiceApp.Tests;

/// <summary>
/// Runs the real API against a private in-memory SQLite database.
/// The open connection keeps the shared-cache database alive for the factory's lifetime.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString =
        $"Data Source=test-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
    private readonly SqliteConnection _keepAlive;

    public ApiFactory()
    {
        _keepAlive = new SqliteConnection(_connectionString);
        _keepAlive.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development"); // runs migrations + seeds finance@demo.com
        builder.UseSetting("ConnectionStrings:Default", _connectionString);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _keepAlive.Dispose();
    }
}

public record Scenario(
    HttpClient Finance,
    HttpClient CourierA,
    HttpClient CourierB,
    HttpClient ClientX,
    HttpClient ClientY,
    CourierDto CourierAInfo,
    CourierDto CourierBInfo,
    ClientDto ClientXInfo,
    ClientDto ClientYInfo);

/// <summary>Helpers that drive the API the same way the frontend does.</summary>
public static class TestApi
{
    public const string Password = "Secret123!";

    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static async Task<HttpClient> LoginAsync(this ApiFactory factory, string email, string password)
    {
        var http = factory.CreateClient();
        var res = await http.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        res.EnsureSuccessStatusCode();
        var login = (await res.Content.ReadFromJsonAsync<LoginResponse>(Json))!;
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);
        return http;
    }

    /// <summary>Fresh couriers and clients with unique emails, so tests sharing a factory don't interfere.</summary>
    public static async Task<Scenario> CreateScenarioAsync(this ApiFactory factory)
    {
        var finance = await factory.LoginAsync("finance@demo.com", DbSeeder.DemoPassword);
        var tag = Guid.NewGuid().ToString("N")[..8];

        async Task<CourierDto> NewCourier(string name)
        {
            var res = await finance.PostAsJsonAsync("/api/couriers",
                new CreateCourierRequest(name, $"{name}-{tag}@test.com", Password));
            return await res.ReadAsync<CourierDto>(HttpStatusCode.Created);
        }

        async Task<ClientDto> NewClient(string name)
        {
            var res = await finance.PostAsJsonAsync("/api/clients", new CreateClientRequest(
                name, $"{name}-{tag}@test.com", "+383 44 000 000", "Rr. Test 1, Prishtinë", 42.66, 21.16, Password));
            return await res.ReadAsync<ClientDto>(HttpStatusCode.Created);
        }

        var courierA = await NewCourier("courier-a");
        var courierB = await NewCourier("courier-b");
        var clientX = await NewClient("client-x");
        var clientY = await NewClient("client-y");

        return new Scenario(
            finance,
            await factory.LoginAsync(courierA.Email, Password),
            await factory.LoginAsync(courierB.Email, Password),
            await factory.LoginAsync(clientX.Email, Password),
            await factory.LoginAsync(clientY.Email, Password),
            courierA, courierB, clientX, clientY);
    }

    public static async Task<InvoiceDto> CreateInvoiceAsync(this HttpClient finance, int clientId, decimal amount = 100m)
    {
        var res = await finance.PostAsJsonAsync("/api/invoices", new SaveInvoiceRequest(
            clientId, amount, "EUR", "Test services", null, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30))));
        return await res.ReadAsync<InvoiceDto>(HttpStatusCode.Created);
    }

    public static Task<HttpResponseMessage> MarkReadyAsync(this HttpClient http, int id, int courierId) =>
        http.PostAsJsonAsync($"/api/invoices/{id}/ready", new MarkReadyRequest(courierId));

    public static Task<HttpResponseMessage> ActionAsync(this HttpClient http, int id, string action) =>
        http.PostAsync($"/api/invoices/{id}/{action}", null);

    public static async Task<T> ReadAsync<T>(this HttpResponseMessage res, HttpStatusCode expected = HttpStatusCode.OK)
    {
        Assert.True(res.StatusCode == expected,
            $"Expected {(int)expected} but got {(int)res.StatusCode}: {await res.Content.ReadAsStringAsync()}");
        return (await res.Content.ReadFromJsonAsync<T>(Json))!;
    }

    public static async Task<string?> ErrorCodeAsync(this HttpResponseMessage res)
    {
        using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return doc.RootElement.TryGetProperty("code", out var code) ? code.GetString() : null;
    }
}
