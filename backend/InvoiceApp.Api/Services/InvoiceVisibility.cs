using InvoiceApp.Api.Domain;

namespace InvoiceApp.Api.Services;

public static class InvoiceVisibility
{
    /// <summary>
    /// The single row-level access rule for invoices. Every read, PDF and status change goes through it.
    /// </summary>
    public static IQueryable<Invoice> VisibleTo(this IQueryable<Invoice> invoices, CurrentUser user) => user.Role switch
    {
        Role.Finance or Role.SuperAdmin => invoices,
        Role.Courier => invoices.Where(i => i.CourierId == user.Id && i.Status >= InvoiceStatus.ReadyForDelivery),
        Role.Client => invoices.Where(i => i.ClientId == user.ClientId && i.Status >= InvoiceStatus.Delivered),
        _ => invoices.Where(_ => false)
    };
}
