using System.Data;
using System.Text;
using Microsoft.Data.SqlClient;
using TodoApi.DTOs;
using TodoApi.Models;

namespace TodoApi.Data;

public class TodoRepository(IDbConnectionFactory connectionFactory) : ITodoRepository
{
    public async Task<IReadOnlyList<TodoItem>> GetFilteredAsync(TodoFilterDto filter, CancellationToken ct = default)
    {
        var sql = new StringBuilder(@"
            SELECT Id, Title, Description, DueDate, Priority, Category, IsCompleted, CreatedAt, UpdatedAt 
            FROM dbo.Todos 
            WHERE 1=1 ");

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand { Connection = connection };

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            sql.Append(" AND (Title LIKE @SearchTerm OR Description LIKE @SearchTerm)");
            command.Parameters.Add(new SqlParameter("@SearchTerm", SqlDbType.NVarChar, 150) { Value = $"%{filter.SearchTerm.Trim()}%" });
        }

        if (!string.IsNullOrWhiteSpace(filter.Priority) && !filter.Priority.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            sql.Append(" AND Priority = @Priority");
            command.Parameters.Add(new SqlParameter("@Priority", SqlDbType.NVarChar, 20) { Value = filter.Priority });
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            sql.Append(" AND Category = @Category");
            command.Parameters.Add(new SqlParameter("@Category", SqlDbType.NVarChar, 20) { Value = filter.Category });
        }

        if (filter.FromDate.HasValue)
        {
            sql.Append(" AND DueDate >= @FromDate");
            command.Parameters.Add(new SqlParameter("@FromDate", SqlDbType.Date) { Value = filter.FromDate.Value.Date });
        }

        if (filter.ToDate.HasValue)
        {
            sql.Append(" AND DueDate <= @ToDate");
            command.Parameters.Add(new SqlParameter("@ToDate", SqlDbType.Date) { Value = filter.ToDate.Value.Date });
        }

        if (filter.IsCompleted.HasValue)
        {
            sql.Append(" AND IsCompleted = @IsCompleted");
            command.Parameters.Add(new SqlParameter("@IsCompleted", SqlDbType.Bit) { Value = filter.IsCompleted.Value });
        }

        sql.Append(" ORDER BY DueDate ASC, Priority DESC, Id DESC;");
        command.CommandText = sql.ToString();

        await connection.OpenAsync(ct);
        using var reader = await command.ExecuteReaderAsync(CommandBehavior.CloseConnection, ct);

        var list = new List<TodoItem>();
        while (await reader.ReadAsync(ct))
        {
            list.Add(MapTodo(reader));
        }

        return list;
    }

    public async Task<TodoItem?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT Id, Title, Description, DueDate, Priority, Category, IsCompleted, CreatedAt, UpdatedAt 
            FROM dbo.Todos 
            WHERE Id = @Id;";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });

        await connection.OpenAsync(ct);
        using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow | CommandBehavior.CloseConnection, ct);

        return await reader.ReadAsync(ct) ? MapTodo(reader) : null;
    }

    public async Task<int> CreateAsync(TodoItem todo, CancellationToken ct = default)
    {
        const string sql = @"
            INSERT INTO dbo.Todos (Title, Description, DueDate, Priority, Category, IsCompleted, CreatedAt)
            OUTPUT INSERTED.Id
            VALUES (@Title, @Description, @DueDate, @Priority, @Category, @IsCompleted, SYSUTCDATETIME());";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);

        command.Parameters.Add(new SqlParameter("@Title", SqlDbType.NVarChar, 150) { Value = todo.Title });
        command.Parameters.Add(new SqlParameter("@Description", SqlDbType.NVarChar, 1000) { Value = (object?)todo.Description ?? DBNull.Value });
        command.Parameters.Add(new SqlParameter("@DueDate", SqlDbType.Date) { Value = todo.DueDate.Date });
        command.Parameters.Add(new SqlParameter("@Priority", SqlDbType.NVarChar, 20) { Value = todo.Priority });
        command.Parameters.Add(new SqlParameter("@Category", SqlDbType.NVarChar, 20) { Value = todo.Category });
        command.Parameters.Add(new SqlParameter("@IsCompleted", SqlDbType.Bit) { Value = todo.IsCompleted });

        await connection.OpenAsync(ct);
        return (int)await command.ExecuteScalarAsync(ct);
    }

    public async Task<bool> UpdateAsync(TodoItem todo, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE dbo.Todos 
            SET Title = @Title,
                Description = @Description,
                DueDate = @DueDate,
                Priority = @Priority,
                Category = @Category,
                IsCompleted = @IsCompleted,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id;";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = todo.Id });
        command.Parameters.Add(new SqlParameter("@Title", SqlDbType.NVarChar, 150) { Value = todo.Title });
        command.Parameters.Add(new SqlParameter("@Description", SqlDbType.NVarChar, 1000) { Value = (object?)todo.Description ?? DBNull.Value });
        command.Parameters.Add(new SqlParameter("@DueDate", SqlDbType.Date) { Value = todo.DueDate.Date });
        command.Parameters.Add(new SqlParameter("@Priority", SqlDbType.NVarChar, 20) { Value = todo.Priority });
        command.Parameters.Add(new SqlParameter("@Category", SqlDbType.NVarChar, 20) { Value = todo.Category });
        command.Parameters.Add(new SqlParameter("@IsCompleted", SqlDbType.Bit) { Value = todo.IsCompleted });

        await connection.OpenAsync(ct);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }




    public async Task<bool> ToggleCompleteAsync(int id, bool isCompleted, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE dbo.Todos 
            SET IsCompleted = @IsCompleted,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id;";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);

        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });
        command.Parameters.Add(new SqlParameter("@IsCompleted", SqlDbType.Bit) { Value = isCompleted });

        await connection.OpenAsync(ct);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    public async Task<bool> ExistsDuplicateAsync(
    string title,
    DateTime dueDate,
    int? excludeId = null,
    CancellationToken ct = default)
    {
        const string sql = @"
        SELECT COUNT(1)
        FROM dbo.Todos
        WHERE Title = @Title
          AND DueDate = @DueDate
          AND (@ExcludeId IS NULL OR Id <> @ExcludeId);";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);

        command.Parameters.Add(
            new SqlParameter("@Title", SqlDbType.NVarChar, 150)
            {
                Value = title.Trim()
            });

        command.Parameters.Add(
            new SqlParameter("@DueDate", SqlDbType.Date)
            {
                Value = dueDate.Date
            });

        command.Parameters.Add(
            new SqlParameter("@ExcludeId", SqlDbType.Int)
            {
                Value = (object?)excludeId ?? DBNull.Value
            });

        await connection.OpenAsync(ct);

        var result = await command.ExecuteScalarAsync(ct);

        return Convert.ToInt32(result) > 0;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM dbo.Todos WHERE Id = @Id;";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);
        command.Parameters.Add(new SqlParameter("@Id", SqlDbType.Int) { Value = id });

        await connection.OpenAsync(ct);
        return await command.ExecuteNonQueryAsync(ct) > 0;
    }

    public async Task<TodoSummaryDto> GetSummaryCountsAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                COUNT(CASE WHEN IsCompleted = 0 THEN 1 END) AS PendingCount,
                COUNT(CASE WHEN IsCompleted = 1 THEN 1 END) AS CompletedCount
            FROM dbo.Todos;";

        using var connection = (SqlConnection)connectionFactory.CreateConnection();
        using var command = new SqlCommand(sql, connection);

        await connection.OpenAsync(ct);
        using var reader = await command.ExecuteReaderAsync(CommandBehavior.SingleRow | CommandBehavior.CloseConnection, ct);

        if (await reader.ReadAsync(ct))
        {
            return new TodoSummaryDto(
                reader.GetInt32(reader.GetOrdinal("PendingCount")),
                reader.GetInt32(reader.GetOrdinal("CompletedCount"))
            );
        }

        return new TodoSummaryDto(0, 0);
    }

    private static TodoItem MapTodo(SqlDataReader r) => new()
    {
        Id = r.GetInt32(r.GetOrdinal("Id")),
        Title = r.GetString(r.GetOrdinal("Title")),
        Description = r.IsDBNull(r.GetOrdinal("Description")) ? null : r.GetString(r.GetOrdinal("Description")),
        DueDate = r.GetDateTime(r.GetOrdinal("DueDate")),
        Priority = r.GetString(r.GetOrdinal("Priority")),
        Category = r.GetString(r.GetOrdinal("Category")),
        IsCompleted = r.GetBoolean(r.GetOrdinal("IsCompleted")),
        CreatedAt = r.GetDateTime(r.GetOrdinal("CreatedAt")),
        UpdatedAt = r.IsDBNull(r.GetOrdinal("UpdatedAt")) ? null : r.GetDateTime(r.GetOrdinal("UpdatedAt"))
    };
}