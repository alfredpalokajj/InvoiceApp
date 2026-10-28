using InvoiceApp.Api.Contracts;
using InvoiceApp.Api.Data;
using InvoiceApp.Api.Domain;
using InvoiceApp.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InvoiceApp.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController(AppDbContext db, InvoiceWorkflow workflow, InvoicePdfService pdf) : ControllerBase
{
    private CurrentUser Me => User.ToCurrentUser();

    [HttpGet]
    public Task<List<InvoiceDto>> List([FromQuery] InvoiceStatus? status, CancellationToken ct)
    {
        var query = db.Invoices.VisibleTo(Me);
        if (status is not null) query = query.Where(i => i.Status == status);
        return query.OrderByDescending(i => i.Id).Select(InvoiceDto.Projection).ToListAsync(ct);
    }

    [HttpGet("{id:int}")]
    public Task<InvoiceDto> Get(int id, CancellationToken ct) => LoadAsync(id, ct);

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> Pdf(int id, [FromQuery] string? lang, CancellationToken ct)
    {
        var invoice = await LoadAsync(id, ct);
        return File(pdf.Generate(invoice, lang), "application/pdf", $"{invoice.Number}.pdf");
    }

    [HttpPost]
    [Authorize(Roles = nameof(Role.Finance))]
    public async Task<ActionResult<InvoiceDto>> Create(SaveInvoiceRequest req, CancellationToken ct)
    {
        var invoice = await workflow.CreateAsync(req, Me, ct);
        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, await LoadAsync(invoice.Id, ct));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = nameof(Role.Finance))]
    public async Task<InvoiceDto> Update(int id, SaveInvoiceRequest req, CancellationToken ct)
    {
        await workflow.UpdateAsync(id, req, Me, ct);
        return await LoadAsync(id, ct);
    }

    [HttpPost("{id:int}/ready")]
    [Authorize(Roles = nameof(Role.Finance))]
    public async Task<InvoiceDto> MarkReady(int id, MarkReadyRequest req, CancellationToken ct)
    {
        await workflow.MarkReadyAsync(id, req.CourierId, Me, ct);
        return await LoadAsync(id, ct);
    }

    [HttpPost("{id:int}/start")]
    [Authorize(Roles = nameof(Role.Courier))]
    public async Task<InvoiceDto> Start(int id, CancellationToken ct)
    {
        await workflow.StartAsync(id, Me, ct);
        return await LoadAsync(id, ct);
    }

    [HttpPost("{id:int}/deliver")]
    [Authorize(Roles = nameof(Role.Courier))]
    public async Task<InvoiceDto> Deliver(int id, CancellationToken ct)
    {
        await workflow.DeliverAsync(id, Me, ct);
        return await LoadAsync(id, ct);
    }

    [HttpPost("{id:int}/pay")]
    [Authorize(Roles = nameof(Role.Client))]
    public async Task<InvoiceDto> Pay(int id, CancellationToken ct)
    {
        await workflow.PayAsync(id, Me, ct);
        return await LoadAsync(id, ct);
    }

    private async Task<InvoiceDto> LoadAsync(int id, CancellationToken ct) =>
        await db.Invoices.VisibleTo(Me).Where(i => i.Id == id).Select(InvoiceDto.Projection)
            .FirstOrDefaultAsync(ct)
        ?? throw Errors.NotFound();
}
