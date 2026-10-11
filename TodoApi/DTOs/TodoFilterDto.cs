namespace TodoApi.DTOs;

public record TodoFilterDto
{
    public string? SearchTerm { get; init; }
    public string? Priority { get; init; }
    public string? Category { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public bool? IsCompleted { get; init; }
}