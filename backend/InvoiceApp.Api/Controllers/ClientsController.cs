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
[Route("api/clients")]
[Authorize(Roles = RoleGroups.Finance)]
public class ClientsController(AppDbContext db, IPasswordHasher<User> hasher) : ControllerBase
{
    [HttpGet]
    public Task<List<ClientDto>> List(CancellationToken ct) =>
        db.Clients.OrderBy(c => c.Name).Select(ClientDto.Projection).ToListAsync(ct);

    [HttpGet("{id:int}")]
    public async Task<ClientDto> Get(int id, CancellationToken ct) =>
        await db.Clients.Where(c => c.Id == id).Select(ClientDto.Projection).FirstOrDefaultAsync(ct)
        ?? throw Errors.NotFound();

    /// <summary>Creates the client together with the login they use to see and pay their invoices.</summary>
    [HttpPost]
    public async Task<ActionResult<ClientDto>> Create(CreateClientRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct)) throw Errors.EmailTaken();

        var client = new Client
        {
            Name = req.Name.Trim(),
            Email = email,
            Phone = req.Phone?.Trim() ?? "",
            Address = req.Address.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude
        };
        var user = new User { FullName = client.Name, Email = email, Role = Role.Client, Client = client };
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(Get), new { id = client.Id }, ClientDto.From(client));
    }

    [HttpPut("{id:int}")]
    public async Task<ClientDto> Update(int id, UpdateClientRequest req, CancellationToken ct)
    {
        var client = await db.Clients.Include(c => c.User).FirstOrDefaultAsync(c => c.Id == id, ct)
            ?? throw Errors.NotFound();
        var email = req.Email.Trim().ToLowerInvariant();
        if (email != client.Email && await db.Users.AnyAsync(u => u.Email == email, ct))
            throw Errors.EmailTaken();

        client.Name = req.Name.Trim();
        client.Email = email;
        client.Phone = req.Phone?.Trim() ?? "";
        client.Address = req.Address.Trim();
        client.Latitude = req.Latitude;
        client.Longitude = req.Longitude;
        if (client.User is not null)
        {
            client.User.Email = email;
            client.User.FullName = client.Name;
        }
        await db.SaveChangesAsync(ct);
        return ClientDto.From(client);
    }
}
