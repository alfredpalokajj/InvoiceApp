using InvoiceApp.Api.Domain;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace InvoiceApp.Api.Services;

/// <summary>
/// An expected business error. <see cref="Code"/> is a stable key the frontend translates.
/// </summary>
public class AppException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
}

public static class Errors
{
    public static AppException NotFound() =>
        new(StatusCodes.Status404NotFound, "not_found", "The requested item was not found.");

    public static AppException Forbidden() =>
        new(StatusCodes.Status403Forbidden, "forbidden", "You are not allowed to do this.");

    public static AppException InvalidTransition(InvoiceStatus from, InvoiceStatus to) =>
        new(StatusCodes.Status409Conflict, "invalid_transition", $"Cannot change status from {from} to {to}.");

    public static AppException NotEditable() =>
        new(StatusCodes.Status409Conflict, "not_editable", "Only invoices in status Created can be edited.");

    public static AppException InvalidCourier() =>
        new(StatusCodes.Status400BadRequest, "invalid_courier", "The selected courier does not exist.");

    public static AppException InvalidClient() =>
        new(StatusCodes.Status400BadRequest, "invalid_client", "The selected client does not exist.");

    public static AppException EmailTaken() =>
        new(StatusCodes.Status409Conflict, "email_taken", "This email is already in use.");

    public static AppException InvalidRole() =>
        new(StatusCodes.Status400BadRequest, "invalid_role",
            "Client accounts are created from the Clients page, together with their address.");

    public static AppException InvalidCredentials() =>
        new(StatusCodes.Status401Unauthorized, "invalid_credentials", "Wrong email or password.");
}

internal sealed class AppExceptionHandler(IProblemDetailsService problemDetails) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        if (exception is not AppException app) return false;

        context.Response.StatusCode = app.Status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = new ProblemDetails
            {
                Status = app.Status,
                Title = app.Message,
                Extensions = { ["code"] = app.Code }
            }
        });
    }
}
