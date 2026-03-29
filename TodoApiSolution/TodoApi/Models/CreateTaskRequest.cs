namespace TodoApi.Models;

public class CreateTaskRequest
{
    public string Text { get; set; } = string.Empty;
    public bool Done { get; set; } = false;
}
