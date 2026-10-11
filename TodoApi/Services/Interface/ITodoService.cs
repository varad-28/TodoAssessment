using TodoApi.DTOs;

namespace TodoApi.Services;

public interface ITodoService
{
    Task<IReadOnlyList<TodoResponseDto>> GetTodosAsync(TodoFilterDto filter, CancellationToken ct = default);
    Task<TodoResponseDto> GetByIdAsync(int id, CancellationToken ct = default);
    Task<TodoResponseDto> CreateAsync(CreateTodoDto dto, CancellationToken ct = default);
    Task<bool> UpdateAsync(int id, UpdateTodoDto dto, CancellationToken ct = default);
    Task<bool> ToggleCompleteAsync(int id, bool isCompleted, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
    Task<TodoSummaryDto> GetSummaryCountsAsync(CancellationToken ct = default);
}