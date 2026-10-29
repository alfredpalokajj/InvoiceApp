using System.Net;
using System.Net.Http.Json;
using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Data;
using InvoiceApp.Api.Domain;

namespace InvoiceApp.Tests;

public class UserManagementTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private Task<HttpClient> AdminAsync() => factory.LoginAsync("admin@demo.com", DbSeeder.DemoPassword);

    private static string UniqueEmail(string name) =>
        $"{name.ToLowerInvariant()}-{Guid.NewGuid().ToString("N")[..8]}@test.com";

    [Theory]
    [InlineData(Role.SuperAdmin)]
    [InlineData(Role.Finance)]
    [InlineData(Role.Courier)]
    public async Task SuperAdmin_creates_users_who_can_sign_in_with_that_role(Role role)
    {
        var admin = await AdminAsync();
        var email = UniqueEmail(role.ToString());

        var created = await (await admin.PostAsJsonAsync("/api/users",
            new CreateUserRequest("New User", email.ToUpperInvariant(), TestApi.Password, role), TestApi.Json))
            .ReadAsync<UserDto>(HttpStatusCode.Created);
        Assert.Equal(email, created.Email);
        Assert.Equal(role, created.Role);

        var me = await (await (await factory.LoginAsync(email, TestApi.Password)).GetAsync("/api/auth/me"))
            .ReadAsync<UserDto>();
        Assert.Equal(created.Id, me.Id);
        Assert.Equal(role, me.Role);

        var list = await (await admin.GetAsync("/api/users")).ReadAsync<List<UserDto>>();
        Assert.Contains(list, u => u.Id == created.Id);
    }

    [Fact]
    public async Task Client_accounts_cannot_be_created_without_a_client_record()
    {
        var admin = await AdminAsync();
        var res = await admin.PostAsJsonAsync("/api/users",
            new CreateUserRequest("Someone", UniqueEmail("client"), TestApi.Password, Role.Client), TestApi.Json);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        Assert.Equal("invalid_role", await res.ErrorCodeAsync());
    }

    [Fact]
    public async Task Update_changes_name_email_and_password_but_keeps_the_role()
    {
        var admin = await AdminAsync();
        var created = await (await admin.PostAsJsonAsync("/api/users",
            new CreateUserRequest("Old Name", UniqueEmail("old"), TestApi.Password, Role.Courier), TestApi.Json))
            .ReadAsync<UserDto>(HttpStatusCode.Created);

        // No password: the old one keeps working.
        var newEmail = UniqueEmail("new");
        var updated = await (await admin.PutAsJsonAsync($"/api/users/{created.Id}",
            new UpdateUserRequest("New Name", newEmail, null))).ReadAsync<UserDto>();
        Assert.Equal("New Name", updated.FullName);
        Assert.Equal(newEmail, updated.Email);
        Assert.Equal(Role.Courier, updated.Role);
        await factory.LoginAsync(newEmail, TestApi.Password);

        await (await admin.PutAsJsonAsync($"/api/users/{created.Id}",
            new UpdateUserRequest("New Name", newEmail, "Changed456!"))).ReadAsync<UserDto>();
        var oldLogin = await factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new LoginRequest(newEmail, TestApi.Password));
        Assert.Equal(HttpStatusCode.Unauthorized, oldLogin.StatusCode);
        await factory.LoginAsync(newEmail, "Changed456!");
    }

    [Fact]
    public async Task Updating_a_client_user_keeps_the_client_record_in_sync()
    {
        var s = await factory.CreateScenarioAsync();
        var admin = await AdminAsync();
        var users = await (await admin.GetAsync("/api/users")).ReadAsync<List<UserDto>>();
        var clientUser = users.Single(u => u.ClientId == s.ClientXInfo.Id);

        var newEmail = UniqueEmail("renamed-client");
        await (await admin.PutAsJsonAsync($"/api/users/{clientUser.Id}",
            new UpdateUserRequest("Renamed Client", newEmail, null))).ReadAsync<UserDto>();

        var client = await (await admin.GetAsync($"/api/clients/{s.ClientXInfo.Id}")).ReadAsync<ClientDto>();
        Assert.Equal("Renamed Client", client.Name);
        Assert.Equal(newEmail, client.Email);
    }

    [Fact]
    public async Task Duplicate_email_is_rejected_on_create_and_update()
    {
        var s = await factory.CreateScenarioAsync();
        var admin = await AdminAsync();

        var create = await admin.PostAsJsonAsync("/api/users",
            new CreateUserRequest("Dup", s.CourierAInfo.Email, TestApi.Password, Role.Finance), TestApi.Json);
        Assert.Equal(HttpStatusCode.Conflict, create.StatusCode);
        Assert.Equal("email_taken", await create.ErrorCodeAsync());

        var update = await admin.PutAsJsonAsync($"/api/users/{s.CourierBInfo.Id}",
            new UpdateUserRequest("Courier B", s.CourierAInfo.Email, null));
        Assert.Equal(HttpStatusCode.Conflict, update.StatusCode);
        Assert.Equal("email_taken", await update.ErrorCodeAsync());
    }

    [Fact]
    public async Task Only_SuperAdmin_can_manage_users()
    {
        var s = await factory.CreateScenarioAsync();
        foreach (var http in new[] { s.Finance, s.CourierA, s.ClientX })
        {
            Assert.Equal(HttpStatusCode.Forbidden, (await http.GetAsync("/api/users")).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await http.PostAsJsonAsync("/api/users",
                new CreateUserRequest("X", UniqueEmail("x"), TestApi.Password, Role.Finance), TestApi.Json)).StatusCode);
            Assert.Equal(HttpStatusCode.Forbidden, (await http.PutAsJsonAsync($"/api/users/{s.CourierAInfo.Id}",
                new UpdateUserRequest("X", UniqueEmail("x"), null))).StatusCode);
        }
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/users")).StatusCode);
    }

    [Fact]
    public async Task SuperAdmin_can_do_what_Finance_does_but_not_courier_or_client_actions()
    {
        var s = await factory.CreateScenarioAsync();
        var admin = await AdminAsync();

        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/clients")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync("/api/couriers")).StatusCode);

        var invoice = await admin.CreateInvoiceAsync(s.ClientXInfo.Id);
        await (await admin.MarkReadyAsync(invoice.Id, s.CourierAInfo.Id)).ReadAsync<InvoiceDto>();

        // Sees invoices Finance created too.
        var financeInvoice = await s.Finance.CreateInvoiceAsync(s.ClientYInfo.Id);
        var list = await (await admin.GetAsync("/api/invoices")).ReadAsync<List<InvoiceDto>>();
        Assert.Contains(list, i => i.Id == invoice.Id);
        Assert.Contains(list, i => i.Id == financeInvoice.Id);

        Assert.Equal(HttpStatusCode.Forbidden, (await admin.ActionAsync(invoice.Id, "start")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await admin.ActionAsync(invoice.Id, "pay")).StatusCode);
    }
}
