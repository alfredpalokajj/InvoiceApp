namespace InvoiceApp.Api.Domain;

public enum Role
{
    Finance,
    Courier,
    Client
}

/// <summary>
/// Invoice lifecycle. Order matters: transitions only move forward one step.
/// </summary>
public enum InvoiceStatus
{
    Created = 0,
    ReadyForDelivery = 1,
    InTransit = 2,
    Delivered = 3, // Delivered / Unpaid
    Paid = 4
}

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public Role Role { get; set; }

    // Set only for users with Role.Client
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
}

public class Client
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public User? User { get; set; }
    public List<Invoice> Invoices { get; set; } = [];
}

public class Invoice
{
    public int Id { get; set; }
    public string Number { get; set; } = "";

    public int ClientId { get; set; }
    public Client Client { get; set; } = null!;

    public int? CourierId { get; set; }
    public User? Courier { get; set; }

    public decimal Amount { get; set; }
    public string Currency { get; set; } = "EUR";
    public string Details { get; set; } = "";
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Created;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadyAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? PaidAt { get; set; }
}
