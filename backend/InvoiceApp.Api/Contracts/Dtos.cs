using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using InvoiceApp.Api.Domain;

namespace InvoiceApp.Api.Contracts;

// ---- Auth ----

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record UserDto(int Id, string FullName, string Email, Role Role, int? ClientId);

public record LoginResponse(string Token, UserDto User);

// ---- Users ----

public record CreateUserRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Required, MinLength(6)] string Password,
    Role Role);

/// <summary>The role is fixed at creation. A null password keeps the current one.</summary>
public record UpdateUserRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress, StringLength(200)] string Email,
    [MinLength(6)] string? Password);

// ---- Clients ----

public record ClientDto(
    int Id, string Name, string Email, string Phone, string Address, double Latitude, double Longitude)
{
    public static readonly Expression<Func<Client, ClientDto>> Projection = c =>
        new ClientDto(c.Id, c.Name, c.Email, c.Phone, c.Address, c.Latitude, c.Longitude);

    public static ClientDto From(Client c) => new(c.Id, c.Name, c.Email, c.Phone, c.Address, c.Latitude, c.Longitude);
}

public record UpdateClientRequest(
    [Required, StringLength(200)] string Name,
    [Required, EmailAddress, StringLength(200)] string Email,
    [StringLength(50)] string? Phone,
    [Required, StringLength(500)] string Address,
    [Range(-90, 90)] double Latitude,
    [Range(-180, 180)] double Longitude);

public record CreateClientRequest(
    [Required, StringLength(200)] string Name,
    [Required, EmailAddress, StringLength(200)] string Email,
    [StringLength(50)] string? Phone,
    [Required, StringLength(500)] string Address,
    [Range(-90, 90)] double Latitude,
    [Range(-180, 180)] double Longitude,
    [Required, MinLength(6)] string Password);

// ---- Couriers ----

public record CourierDto(int Id, string FullName, string Email);

public record CreateCourierRequest(
    [Required, StringLength(200)] string FullName,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Required, MinLength(6)] string Password);

// ---- Invoices ----

public record InvoiceDto(
    int Id,
    string Number,
    ClientDto Client,
    CourierDto? Courier,
    decimal Amount,
    string Currency,
    string Details,
    DateOnly IssueDate,
    DateOnly DueDate,
    InvoiceStatus Status,
    DateTime CreatedAt,
    DateTime? ReadyAt,
    DateTime? StartedAt,
    DateTime? DeliveredAt,
    DateTime? PaidAt)
{
    public static readonly Expression<Func<Invoice, InvoiceDto>> Projection = i => new InvoiceDto(
        i.Id,
        i.Number,
        new ClientDto(i.Client.Id, i.Client.Name, i.Client.Email, i.Client.Phone, i.Client.Address,
            i.Client.Latitude, i.Client.Longitude),
        i.Courier == null ? null : new CourierDto(i.Courier.Id, i.Courier.FullName, i.Courier.Email),
        i.Amount,
        i.Currency,
        i.Details,
        i.IssueDate,
        i.DueDate,
        i.Status,
        i.CreatedAt,
        i.ReadyAt,
        i.StartedAt,
        i.DeliveredAt,
        i.PaidAt);
}

public record SaveInvoiceRequest(
    [Range(1, int.MaxValue)] int ClientId,
    [Range(typeof(decimal), "0.01", "100000000",
        ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)] decimal Amount,
    [StringLength(3, MinimumLength = 3)] string? Currency,
    [StringLength(4000)] string? Details,
    DateOnly? IssueDate,
    [Required] DateOnly? DueDate);

public record MarkReadyRequest([Range(1, int.MaxValue)] int CourierId);
