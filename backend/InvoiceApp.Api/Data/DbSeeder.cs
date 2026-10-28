using InvoiceApp.Api.Domain;
using Microsoft.AspNetCore.Identity;

namespace InvoiceApp.Api.Data;

/// <summary>Demo data for development. Every account uses the password <see cref="DemoPassword"/>.</summary>
public static class DbSeeder
{
    public const string DemoPassword = "Demo123!";

    public static void Seed(AppDbContext db, IPasswordHasher<User> hasher)
    {
        if (db.Users.Any()) return;

        User NewUser(string name, string email, Role role, Client? client = null)
        {
            var u = new User { FullName = name, Email = email, Role = role, Client = client };
            u.PasswordHash = hasher.HashPassword(u, DemoPassword);
            return u;
        }

        var alfa = new Client
        {
            Name = "Alfa Trade SH.P.K.", Email = "alfa@demo.com", Phone = "+383 44 111 222",
            Address = "Rr. Agim Ramadani 15, Prishtinë", Latitude = 42.6612, Longitude = 21.1597
        };
        var beta = new Client
        {
            Name = "Beta Market", Email = "beta@demo.com", Phone = "+383 45 333 444",
            Address = "Bulevardi Bill Clinton 30, Prishtinë", Latitude = 42.6505, Longitude = 21.1580
        };
        var gama = new Client
        {
            Name = "Gama Tech L.L.C.", Email = "gama@demo.com", Phone = "+383 49 555 666",
            Address = "Rr. UÇK 50, Prishtinë", Latitude = 42.6675, Longitude = 21.1663
        };

        var finance = NewUser("Drita Hoxha", "finance@demo.com", Role.Finance);
        var courier1 = NewUser("Arben Krasniqi", "postieri1@demo.com", Role.Courier);
        var courier2 = NewUser("Blerim Gashi", "postieri2@demo.com", Role.Courier);
        db.Users.AddRange(
            finance, courier1, courier2,
            NewUser(alfa.Name, alfa.Email, Role.Client, alfa),
            NewUser(beta.Name, beta.Email, Role.Client, beta),
            NewUser(gama.Name, gama.Email, Role.Client, gama));

        var now = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(now);
        var seq = 0;
        Invoice NewInvoice(Client c, decimal amount, string details, InvoiceStatus status, User? courier = null)
        {
            var i = new Invoice
            {
                Number = $"FAT-{today.Year}-{++seq:D4}",
                Client = c,
                Courier = courier,
                Amount = amount,
                Details = details,
                IssueDate = today.AddDays(-7),
                DueDate = today.AddDays(23),
                Status = status,
                CreatedAt = now.AddDays(-7)
            };
            if (status >= InvoiceStatus.ReadyForDelivery) i.ReadyAt = now.AddDays(-6);
            if (status >= InvoiceStatus.InTransit) i.StartedAt = now.AddDays(-5);
            if (status >= InvoiceStatus.Delivered) i.DeliveredAt = now.AddDays(-5).AddHours(2);
            if (status >= InvoiceStatus.Paid) i.PaidAt = now.AddDays(-2);
            return i;
        }

        db.Invoices.AddRange(
            NewInvoice(alfa, 1250.00m, "Shërbime konsulence – Tetor", InvoiceStatus.Created),
            NewInvoice(beta, 480.50m, "Furnizim me material zyre", InvoiceStatus.Created),
            NewInvoice(gama, 2300.00m, "Mirëmbajtje e rrjetit – T3", InvoiceStatus.ReadyForDelivery, courier1),
            NewInvoice(alfa, 760.00m, "Licenca softuerike (12 muaj)", InvoiceStatus.ReadyForDelivery, courier2),
            NewInvoice(beta, 315.75m, "Transport mallrash", InvoiceStatus.InTransit, courier1),
            NewInvoice(gama, 990.00m, "Pajisje harduerike", InvoiceStatus.Delivered, courier1),
            NewInvoice(alfa, 150.00m, "Trajnim stafi", InvoiceStatus.Paid, courier2));

        db.SaveChanges();
    }
}
