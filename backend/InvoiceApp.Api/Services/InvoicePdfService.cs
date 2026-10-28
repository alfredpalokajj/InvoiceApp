using System.Globalization;
using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Domain;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InvoiceApp.Api.Services;

public class InvoicePdfService
{
    private static readonly Dictionary<string, Dictionary<string, string>> Labels = new()
    {
        ["sq"] = new()
        {
            ["title"] = "FATURË",
            ["number"] = "Numri",
            ["issueDate"] = "Data e lëshimit",
            ["dueDate"] = "Afati i pagesës",
            ["status"] = "Statusi",
            ["billTo"] = "Faturuar për",
            ["details"] = "Përshkrimi",
            ["amount"] = "Shuma",
            ["total"] = "Totali për pagesë",
            ["courier"] = "Postieri",
            ["generated"] = "Gjeneruar më",
            ["page"] = "Faqja",
            [nameof(InvoiceStatus.Created)] = "E krijuar",
            [nameof(InvoiceStatus.ReadyForDelivery)] = "Gati për dërgim",
            [nameof(InvoiceStatus.InTransit)] = "E nisur",
            [nameof(InvoiceStatus.Delivered)] = "E dorëzuar / E papaguar",
            [nameof(InvoiceStatus.Paid)] = "E paguar"
        },
        ["en"] = new()
        {
            ["title"] = "INVOICE",
            ["number"] = "Number",
            ["issueDate"] = "Issue date",
            ["dueDate"] = "Due date",
            ["status"] = "Status",
            ["billTo"] = "Bill to",
            ["details"] = "Description",
            ["amount"] = "Amount",
            ["total"] = "Total due",
            ["courier"] = "Courier",
            ["generated"] = "Generated on",
            ["page"] = "Page",
            [nameof(InvoiceStatus.Created)] = "Created",
            [nameof(InvoiceStatus.ReadyForDelivery)] = "Ready for delivery",
            [nameof(InvoiceStatus.InTransit)] = "In transit",
            [nameof(InvoiceStatus.Delivered)] = "Delivered / Unpaid",
            [nameof(InvoiceStatus.Paid)] = "Paid"
        }
    };

    public byte[] Generate(InvoiceDto invoice, string? lang)
    {
        var l = Labels[lang is "en" ? "en" : "sq"];
        var culture = CultureInfo.GetCultureInfo(lang is "en" ? "en-GB" : "sq-AL");
        string Date(DateOnly d) => d.ToString("dd.MM.yyyy", culture);
        string Money(decimal v) => $"{v.ToString("N2", culture)} {invoice.Currency}";

        return Document.Create(doc => doc.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.DefaultTextStyle(t => t.FontSize(10).FontColor(Colors.Grey.Darken4));

            page.Header().Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().Text(l["title"]).FontSize(24).Bold().FontColor(Colors.Blue.Darken3);
                    col.Item().Text(invoice.Number).FontSize(12).SemiBold();
                });
                row.ConstantItem(200).AlignRight().Column(col =>
                {
                    col.Item().Text($"{l["issueDate"]}: {Date(invoice.IssueDate)}");
                    col.Item().Text($"{l["dueDate"]}: {Date(invoice.DueDate)}");
                    col.Item().Text($"{l["status"]}: {l[invoice.Status.ToString()]}").SemiBold();
                });
            });

            page.Content().PaddingVertical(1, Unit.Centimetre).Column(col =>
            {
                col.Spacing(18);

                col.Item().Background(Colors.Grey.Lighten4).Padding(12).Column(c =>
                {
                    c.Item().Text(l["billTo"]).FontSize(9).FontColor(Colors.Grey.Darken1);
                    c.Item().Text(invoice.Client.Name).FontSize(13).SemiBold();
                    c.Item().Text(invoice.Client.Address);
                    if (!string.IsNullOrWhiteSpace(invoice.Client.Phone)) c.Item().Text(invoice.Client.Phone);
                    c.Item().Text(invoice.Client.Email);
                });

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(4);
                        cols.RelativeColumn(1);
                    });
                    table.Header(h =>
                    {
                        h.Cell().BorderBottom(1).PaddingBottom(6).Text(l["details"]).SemiBold();
                        h.Cell().BorderBottom(1).PaddingBottom(6).AlignRight().Text(l["amount"]).SemiBold();
                    });
                    table.Cell().PaddingVertical(8)
                        .Text(string.IsNullOrWhiteSpace(invoice.Details) ? "—" : invoice.Details);
                    table.Cell().PaddingVertical(8).AlignRight().Text(Money(invoice.Amount));
                });

                col.Item().AlignRight().BorderTop(1).PaddingTop(8).Text(t =>
                {
                    t.Span($"{l["total"]}: ").SemiBold();
                    t.Span(Money(invoice.Amount)).FontSize(14).Bold();
                });

                if (invoice.Courier is not null)
                    col.Item().Text($"{l["courier"]}: {invoice.Courier.FullName}").FontColor(Colors.Grey.Darken1);
            });

            page.Footer().Row(row =>
            {
                row.RelativeItem().Text($"{l["generated"]} {DateTime.Now.ToString("dd.MM.yyyy HH:mm", culture)}")
                    .FontSize(8).FontColor(Colors.Grey.Darken1);
                row.RelativeItem().AlignRight().Text(t =>
                {
                    t.DefaultTextStyle(s => s.FontSize(8).FontColor(Colors.Grey.Darken1));
                    t.Span($"{l["page"]} ");
                    t.CurrentPageNumber();
                    t.Span(" / ");
                    t.TotalPages();
                });
            });
        })).GeneratePdf();
    }
}
