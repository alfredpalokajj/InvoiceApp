using InvoiceApp.Api.Domain;
using InvoiceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace InvoiceApp.Api.Hubs;

/// <summary>
/// Push-only hub. Clients listen for "InvoiceUpdated" and refetch what they can see.
/// </summary>
[Authorize]
public class InvoiceHub : Hub
{
    public const string FinanceGroup = "role:Finance";
    public static string UserGroup(int userId) => $"user:{userId}";

    public override async Task OnConnectedAsync()
    {
        var user = Context.User!.ToCurrentUser();
        if (user.Role.HasFinanceAccess())
            await Groups.AddToGroupAsync(Context.ConnectionId, FinanceGroup);
        await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(user.Id));
        await base.OnConnectedAsync();
    }
}
