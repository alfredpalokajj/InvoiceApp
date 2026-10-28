using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Data;
using InvoiceApp.Api.Domain;
using InvoiceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, IPasswordHasher<User> hasher, TokenService tokens) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<LoginResponse> Login(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password)
                == PasswordVerificationResult.Failed)
            throw Errors.InvalidCredentials();

        return new LoginResponse(tokens.CreateToken(user), ToDto(user));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<UserDto> Me(CancellationToken ct)
    {
        var id = User.ToCurrentUser().Id;
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct) ?? throw Errors.NotFound();
        return ToDto(user);
    }

    private static UserDto ToDto(User u) => new(u.Id, u.FullName, u.Email, u.Role, u.ClientId);
}
