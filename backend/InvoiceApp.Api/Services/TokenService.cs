using System.Text;
using InvoiceApp.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace InvoiceApp.Api.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = "InvoiceApp";
    public string Audience { get; set; } = "InvoiceApp";
    public string Key { get; set; } = "";
    public int ExpiryHours { get; set; } = 12;

    public SymmetricSecurityKey SigningKey() => new(Encoding.UTF8.GetBytes(Key));
}

public class TokenService(IOptions<JwtSettings> options, TimeProvider clock)
{
    public string CreateToken(User user)
    {
        var settings = options.Value;
        var claims = new Dictionary<string, object>
        {
            [ClaimNames.Sub] = user.Id.ToString(),
            [ClaimNames.Name] = user.FullName,
            [ClaimNames.Email] = user.Email,
            [ClaimNames.Role] = user.Role.ToString()
        };
        if (user.ClientId is int clientId) claims[ClaimNames.ClientId] = clientId.ToString();

        var now = clock.GetUtcNow().UtcDateTime;
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = settings.Issuer,
            Audience = settings.Audience,
            Claims = claims,
            IssuedAt = now,
            NotBefore = now,
            Expires = now.AddHours(settings.ExpiryHours),
            SigningCredentials = new SigningCredentials(settings.SigningKey(), SecurityAlgorithms.HmacSha256)
        });
    }
}
