using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Data;

public interface ITodoRepository
{
    Task<IReadOnlyList<TodoItem>> GetFilteredAsync(TodoFilterDto filter, CancellationToken ct = default);
    Task<TodoItem?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> CreateAsync(TodoItem todo, CancellationToken ct = default);
    Task<bool> UpdateAsync(TodoItem todo, CancellationToken ct = default);
    Task<bool> ToggleCompleteAsync(int id, bool isCompleted, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<TodoSummaryDto> GetSummaryCountsAsync(CancellationToken ct = default);

    Task<bool> ExistsDuplicateAsync(
    string title,
    DateTime dueDate,
    int? excludeId = null,
    CancellationToken ct = default);
}