using System.Data;
using Dapper;
using Npgsql;
using TodoApi.Models;

namespace TodoApi.Data;

public class TaskRepository : ITaskRepository
{
    private readonly string _connectionString;

    public TaskRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("No se encontró la cadena de conexión 'DefaultConnection'.");
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<IEnumerable<TaskItem>> GetAllAsync()
    {
        const string sql = @"
            SELECT
                id,
                text,
                done,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM tasks
            ORDER BY updated_at DESC;";

        using var connection = CreateConnection();
        return await connection.QueryAsync<TaskItem>(sql);
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id)
    {
        const string sql = @"
            SELECT
                id,
                text,
                done,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM tasks
            WHERE id = @Id;";

        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<TaskItem>(sql, new { Id = id });
    }

    public async Task<TaskItem> CreateAsync(CreateTaskRequest request)
    {
        const string sql = @"
            INSERT INTO tasks (id, text, done, created_at, updated_at)
            VALUES (@Id, @Text, @Done, @CreatedAt, @UpdatedAt)
            RETURNING
                id,
                text,
                done,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt;";

        var now = DateTime.UtcNow;

        var parameters = new
        {
            Id = Guid.NewGuid(),
            Text = request.Text.Trim(),
            Done = request.Done,
            CreatedAt = now,
            UpdatedAt = now
        };

        using var connection = CreateConnection();
        return await connection.QuerySingleAsync<TaskItem>(sql, parameters);
    }

    public async Task<TaskItem?> UpdateAsync(Guid id, UpdateTaskRequest request)
    {
        const string sql = @"
            UPDATE tasks
            SET
                text = @Text,
                done = @Done,
                updated_at = @UpdatedAt
            WHERE id = @Id
            RETURNING
                id,
                text,
                done,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt;";

        var parameters = new
        {
            Id = id,
            Text = request.Text.Trim(),
            Done = request.Done,
            UpdatedAt = DateTime.UtcNow
        };

        using var connection = CreateConnection();
        return await connection.QueryFirstOrDefaultAsync<TaskItem>(sql, parameters);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        const string sql = @"DELETE FROM tasks WHERE id = @Id;";

        using var connection = CreateConnection();
        var rows = await connection.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}
