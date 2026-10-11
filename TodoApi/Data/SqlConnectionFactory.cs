using System.Data;
using Microsoft.Data.SqlClient;

namespace TodoApi.Data;

public class SqlConnectionFactory(string connectionString) : IDbConnectionFactory
{
    public IDbConnection CreateConnection() => new SqlConnection(connectionString);
}