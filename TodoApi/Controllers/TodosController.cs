using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs;
using TodoApi.Services;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodosController(ITodoService todoService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TodoResponseDto>>> GetAll([FromQuery] TodoFilterDto filter, CancellationToken ct)
    {
        var result = await todoService.GetTodosAsync(filter, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TodoResponseDto>> GetById(int id, CancellationToken ct)
    {
        var result = await todoService.GetByIdAsync(id, ct);
        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<TodoSummaryDto>> GetSummary(CancellationToken ct)
    {
        return Ok(await todoService.GetSummaryCountsAsync(ct));
    }

    [HttpPost]
    public async Task<ActionResult<TodoResponseDto>> Create([FromBody] CreateTodoDto dto, CancellationToken ct)
    {
        var created = await todoService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTodoDto dto, CancellationToken ct)
    {
        await todoService.UpdateAsync(id, dto, ct);
        return NoContent();
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> ToggleComplete(int id, [FromQuery] bool isCompleted, CancellationToken ct)
    {
        await todoService.ToggleCompleteAsync(id, isCompleted, ct);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await todoService.DeleteAsync(id, ct);
        return NoContent();
    }
}