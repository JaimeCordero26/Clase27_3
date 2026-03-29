namespace TodoApi.Models;

public class TaskItem
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
