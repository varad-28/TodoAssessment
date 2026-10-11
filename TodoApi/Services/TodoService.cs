using TodoApi.Data;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Services;

public class TodoService(ITodoRepository repository) : ITodoService
{
    public async Task<IReadOnlyList<TodoResponseDto>> GetTodosAsync(TodoFilterDto filter, CancellationToken ct = default)
    {
        var items = await repository.GetFilteredAsync(filter, ct);
        return items.Select(MapToDto).ToList();
    }

    public async Task<TodoResponseDto> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var item = await repository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Task with ID {id} was not found.");
        return MapToDto(item);
    }

    public async Task<TodoResponseDto> CreateAsync(
     CreateTodoDto dto,
     CancellationToken ct = default)
    {
        if (dto.DueDate.Date < DateTime.Today)
        {
            throw new ArgumentException(
                "Due date cannot be earlier than today.");
        }

        if (await repository.ExistsDuplicateAsync(
            dto.Title,
            dto.DueDate,
            null,
            ct))
        {
            throw new ArgumentException(
                "A task with the same name and due date already exists.");
        }

        var entity = new TodoItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            DueDate = dto.DueDate,
            Priority = dto.Priority,
            Category = dto.Category,
            IsCompleted = false
        };

        entity.Id = await repository.CreateAsync(entity, ct);

        return MapToDto(entity);
    }

    public async Task<bool> UpdateAsync(
      int id,
      UpdateTodoDto dto,
      CancellationToken ct = default)
    {
        var existing = await repository.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException(
                $"Task with ID {id} was not found.");

        if (dto.DueDate.Date < DateTime.Today)
        {
            throw new ArgumentException(
                "Due date cannot be earlier than today.");
        }

        if (await repository.ExistsDuplicateAsync(
            dto.Title,
            dto.DueDate,
            id,
            ct))
        {
            throw new ArgumentException(
                "A task with the same name and due date already exists.");
        }

        existing.Title = dto.Title.Trim();
        existing.Description = dto.Description?.Trim();
        existing.DueDate = dto.DueDate;
        existing.Priority = dto.Priority;
        existing.Category = dto.Category;
        existing.IsCompleted = dto.IsCompleted;

        return await repository.UpdateAsync(existing, ct);
    }

    public async Task<bool> ToggleCompleteAsync(int id, bool isCompleted, CancellationToken ct = default)
    {
        var exists = await repository.GetByIdAsync(id, ct);
        if (exists is null) throw new KeyNotFoundException($"Task with ID {id} was not found.");

        return await repository.ToggleCompleteAsync(id, isCompleted, ct);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var exists = await repository.GetByIdAsync(id, ct);
        if (exists is null) throw new KeyNotFoundException($"Task with ID {id} was not found.");

        return await repository.DeleteAsync(id, ct);
    }

    public Task<TodoSummaryDto> GetSummaryCountsAsync(CancellationToken ct = default)
        => repository.GetSummaryCountsAsync(ct);

    private static TodoResponseDto MapToDto(TodoItem t) =>
        new(t.Id, t.Title, t.Description, t.DueDate, t.Priority, t.Category, t.IsCompleted, t.CreatedAt);
}