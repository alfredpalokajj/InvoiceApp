using System.Security.Claims;
using InvoiceApp.Api.Domain;

namespace InvoiceApp.Api.Services;

/// <summary>The authenticated caller, read from the JWT claims.</summary>
public sealed record CurrentUser(int Id, Role Role, int? ClientId);

public static class ClaimNames
{
    public const string Sub = "sub";
    public const string Name = "name";
    public const string Email = "email";
    public const string Role = "role";
    public const string ClientId = "clientId";
}

public static class ClaimsPrincipalExtensions
{
    public static CurrentUser ToCurrentUser(this ClaimsPrincipal principal)
    {
        var id = int.Parse(principal.FindFirstValue(ClaimNames.Sub)
            ?? throw new InvalidOperationException("Missing sub claim"));
        var role = Enum.Parse<Role>(principal.FindFirstValue(ClaimNames.Role)
            ?? throw new InvalidOperationException("Missing role claim"));
        var clientId = int.TryParse(principal.FindFirstValue(ClaimNames.ClientId), out var c) ? c : (int?)null;
        return new CurrentUser(id, role, clientId);
    }
}
