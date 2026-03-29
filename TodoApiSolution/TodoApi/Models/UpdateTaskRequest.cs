namespace TodoApi.Models;

public class UpdateTaskRequest
{
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; }
}
