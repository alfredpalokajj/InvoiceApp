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
[Route("api/users")]
[Authorize(Roles = nameof(Role.SuperAdmin))]
public class UsersController(AppDbContext db, IPasswordHasher<User> hasher) : ControllerBase
{
    [HttpGet]
    public async Task<List<UserDto>> List(CancellationToken ct)
    {
        // Role is stored as a string, so order in memory to follow the enum rather than the alphabet.
        var users = await db.Users.Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Role, u.ClientId)).ToListAsync(ct);
        return users.OrderBy(u => u.Role).ThenBy(u => u.FullName).ToList();
    }

    [HttpGet("{id:int}")]
    public async Task<UserDto> Get(int id, CancellationToken ct) =>
        await db.Users.Where(u => u.Id == id)
            .Select(u => new UserDto(u.Id, u.FullName, u.Email, u.Role, u.ClientId))
            .FirstOrDefaultAsync(ct)
        ?? throw Errors.NotFound();

    /// <summary>Client logins are created with their client record via <c>POST /api/clients</c>.</summary>
    [HttpPost]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest req, CancellationToken ct)
    {
        if (req.Role is not (Role.SuperAdmin or Role.Finance or Role.Courier)) throw Errors.InvalidRole();

        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct)) throw Errors.EmailTaken();

        var user = new User { FullName = req.FullName.Trim(), Email = email, Role = req.Role };
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = user.Id }, ToDto(user));
    }

    [HttpPut("{id:int}")]
    public async Task<UserDto> Update(int id, UpdateUserRequest req, CancellationToken ct)
    {
        var user = await db.Users.Include(u => u.Client).FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw Errors.NotFound();
        var email = req.Email.Trim().ToLowerInvariant();
        if (email != user.Email && await db.Users.AnyAsync(u => u.Email == email, ct))
            throw Errors.EmailTaken();

        user.FullName = req.FullName.Trim();
        user.Email = email;
        if (!string.IsNullOrEmpty(req.Password)) user.PasswordHash = hasher.HashPassword(user, req.Password);
        // A client's name and email live on both records; keep them in sync like ClientsController does.
        if (user.Client is not null)
        {
            user.Client.Name = user.FullName;
            user.Client.Email = email;
        }
        await db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    private static UserDto ToDto(User u) => new(u.Id, u.FullName, u.Email, u.Role, u.ClientId);
}
