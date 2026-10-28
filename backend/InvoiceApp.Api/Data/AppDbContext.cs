using InvoiceApp.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Invoice> Invoices => Set<Invoice>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(200);
            e.Property(u => u.FullName).HasMaxLength(200);
            e.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            e.HasOne(u => u.Client)
                .WithOne(c => c.User)
                .HasForeignKey<User>(u => u.ClientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Client>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(200);
            e.Property(c => c.Email).HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.Property(c => c.Address).HasMaxLength(500);
        });

        b.Entity<Invoice>(e =>
        {
            e.HasIndex(i => i.Number).IsUnique();
            e.HasIndex(i => i.Status);
            e.Property(i => i.Number).HasMaxLength(30);
            e.Property(i => i.Currency).HasMaxLength(3);
            e.Property(i => i.Details).HasMaxLength(4000);
            // SQLite has no decimal type; store as REAL so it can be sorted and summed in SQL.
            e.Property(i => i.Amount).HasConversion<double>();
            e.HasOne(i => i.Client)
                .WithMany(c => c.Invoices)
                .HasForeignKey(i => i.ClientId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(i => i.Courier)
                .WithMany()
                .HasForeignKey(i => i.CourierId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
