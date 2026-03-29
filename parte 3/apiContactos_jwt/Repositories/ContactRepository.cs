// Repositories/ContactRepository.cs
using System.Data;
using Dapper;
using Npgsql;
using ContactsApi.Models;

namespace ContactsApi.Repositories;

public class ContactRepository
{
    private readonly string _connectionString;

    public ContactRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<IEnumerable<Contact>> GetAllAsync()
    {
        try{
            using var conn = CreateConnection();
            const string sql = "SELECT id, nombre, telefono, email FROM contact ORDER BY id";
            var result = await conn.QueryAsync<Contact>(sql);
            return result;
        }catch (Exception ex){        
            throw new Exception("Error al obtener los contactos de la base de datos.", ex);
        }
    }

    public async Task<Contact?> GetByIdAsync(int id)
    {
        try{
            using var conn = CreateConnection();
            const string sql = "SELECT id, nombre, telefono, email FROM contact WHERE id = @Id";
            var result = await conn.QuerySingleOrDefaultAsync<Contact>(sql, new { Id = id });
            return result;
        }catch (Exception ex){        
            throw new Exception($"Error al obtener el contacto con id = {id}.", ex);
        }
    }

    public async Task<IEnumerable<Contact>> GetByNameAsync(String name)
    {
        try{
            using var conn = CreateConnection();
            string sql = "SELECT id, nombre, telefono, email FROM contact";
            if (!string.IsNullOrEmpty(name)){
                sql += " WHERE upper(nombre) like '%' || @Name || '%'";
                return await conn.QueryAsync<Contact>(sql, new { Name = name.ToUpper() });
            }else{
                return await conn.QueryAsync<Contact>(sql);    
            }
        }catch (Exception ex){        
            throw new Exception($"Error al obtener contactos con nombre similar a {name}.", ex);
        }                    
    }

    public async Task<int> CreateAsync(Contact contact)
    {
        try{
            using var conn = CreateConnection();
            const string sql = @"
                INSERT INTO contact (nombre, telefono, email) 
                VALUES (@Nombre, @Telefono, @Email)
                RETURNING id;
            ";
            var newId = await conn.ExecuteScalarAsync<int>(sql, contact);
            return newId;
        }catch (Exception ex)
        {        
            throw new Exception("Error al insertar el contacto en la base de datos.", ex);
        }
    }

    public async Task<bool> UpdateAsync(int id, Contact contact)
    {
        try{
            using var conn = CreateConnection();
            const string sql = @"
                UPDATE contact 
                SET nombre = @Nombre, 
                    telefono = @Telefono, 
                    email = @Email
                WHERE id = @Id
            ";
            var rows = await conn.ExecuteAsync(sql, new { Id = id, contact.Nombre, contact.Telefono, contact.Email });
            return rows > 0;
        }catch (Exception ex)
        {        
            throw new Exception($"Error al tratar de actualizar el contacto id = {id}.", ex);
        }
    }

    public async Task<bool> DeleteAsync(int id)
    {
        try{
            using var conn = CreateConnection();
            const string sql = "DELETE FROM contact WHERE id = @Id";
            var rows = await conn.ExecuteAsync(sql, new { Id = id });
            return rows > 0;
        }catch (Exception ex)
        {        
            throw new Exception($"Error al tratar de borrar el contacto id = {id}.", ex);
        }
    }
}
