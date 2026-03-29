// Controllers/ContactsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactsApi.Models;
using ContactsApi.Repositories;

namespace ContactsApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ContactsController : ControllerBase
{
    private readonly ContactRepository _repository;

    public ContactsController(ContactRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Contact>>> GetAll()
    {
        var contacts = await _repository.GetAllAsync();
        return Ok(contacts);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Contact>>> GetByName([FromQuery] string? name = null)
    {
        var finalName = name ?? "";
        var contacts = await _repository.GetByNameAsync(finalName);
        if (contacts == null || !contacts.Any())
            return NotFound("No se encontraron contactos con ese nombre.");

        return Ok(contacts);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Contact>> GetById(int id)
    {
        var contact = await _repository.GetByIdAsync(id);
        if (contact == null) return NotFound();
        return Ok(contact);
    }

    [HttpPost]
    public async Task<ActionResult<Contact>> Create(Contact contact)
    {
        if (string.IsNullOrWhiteSpace(contact.Nombre))
            return BadRequest("El campo nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(contact.Telefono))
            return BadRequest("El campo telefono es obligatorio.");

        var newId = await _repository.CreateAsync(contact);
        contact.Id = newId;
        return CreatedAtAction(nameof(GetById), new { id = newId }, contact);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Contact contact)
    {
        if (id != contact.Id)
            return BadRequest("El id de la ruta no coincide con el objeto.");

        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
            return NotFound();

        var success = await _repository.UpdateAsync(id, contact);
        if (!success) return BadRequest("No se pudo actualizar.");
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null) return NotFound();

        var success = await _repository.DeleteAsync(id);
        if (!success) return BadRequest("No se pudo eliminar.");
        return NoContent();
    }
}
