// Models/Contact.cs
namespace ContactsApi.Models
{
    public class Contact
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Telefono { get; set; } = null!;
        public string? Email { get; set; }
    }
}
