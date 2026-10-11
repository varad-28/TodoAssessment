using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs;

public record CreateTodoDto
{
    [Required(ErrorMessage = "Task Name is required.")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Task Name must be between 2 and 150 characters.")]
    public string Title { get; init; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
    public string? Description { get; init; }

    [Required(ErrorMessage = "Due Date is required.")]
    public DateTime DueDate { get; init; }

    [Required(ErrorMessage = "Priority is required.")]
    [RegularExpression("^(High|Medium|Low)$", ErrorMessage = "Priority must be High, Medium, or Low.")]
    public string Priority { get; init; } = string.Empty;

    [Required(ErrorMessage = "Category is required.")]
    [RegularExpression("^(Work|Personal)$", ErrorMessage = "Category must be Work or Personal.")]
    public string Category { get; init; } = string.Empty;
}

public record UpdateTodoDto : CreateTodoDto
{
    public bool IsCompleted { get; init; }
}

public record TodoResponseDto(
    int Id,
    string Title,
    string? Description,
    DateTime DueDate,
    string Priority,
    string Category,
    bool IsCompleted,
    DateTime CreatedAt
);

public record TodoSummaryDto(int PendingCount, int CompletedCount);