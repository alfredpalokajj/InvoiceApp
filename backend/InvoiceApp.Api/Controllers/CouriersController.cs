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
[Route("api/couriers")]
[Authorize(Roles = RoleGroups.Finance)]
public class CouriersController(AppDbContext db, IPasswordHasher<User> hasher) : ControllerBase
{
    [HttpGet]
    public Task<List<CourierDto>> List(CancellationToken ct) =>
        db.Users.Where(u => u.Role == Role.Courier)
            .OrderBy(u => u.FullName)
            .Select(u => new CourierDto(u.Id, u.FullName, u.Email))
            .ToListAsync(ct);

    [HttpPost]
    public async Task<ActionResult<CourierDto>> Create(CreateCourierRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct)) throw Errors.EmailTaken();

        var user = new User { FullName = req.FullName.Trim(), Email = email, Role = Role.Courier };
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return Created($"/api/couriers/{user.Id}", new CourierDto(user.Id, user.FullName, user.Email));
    }
}
