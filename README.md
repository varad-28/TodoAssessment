# Todo Assessment

A full-stack Todo application built with **React.js**, **ASP.NET Core Web API**, **C#**, **ADO.NET**, and **Microsoft SQL Server**.

Users can create, view, update, delete, and manage Todo tasks through a React frontend connected to an ASP.NET Core REST API.

---

## 🚀 Technologies Used

### Frontend
- React.js
- JavaScript
- HTML
- CSS
- Vite

### Backend
- C#
- ASP.NET Core Web API
- .NET 8
- ADO.NET
- RESTful APIs

### Database
- Microsoft SQL Server

### Tools
- Visual Studio
- Visual Studio Code
- Git
- GitHub

---

## ✨ Features

- Create, view, edit, and delete Todo tasks
- Mark Todos as completed or incomplete
- Priority and category for each Todo
- Due date validation
- Prevent selecting a past due date
- React frontend integrated with the API
- ASP.NET Core Web API with REST architecture
- SQL Server database using ADO.NET

---

## 📁 Project Structure

```text
TodoAssessment/
│
├── TodoApi/
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   ├── Properties/
│   ├── appsettings.json
│   └── ...
│
├── TodoFrontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

## ⚙️ Prerequisites

Make sure the following are installed:

- .NET 8 SDK
- Node.js and npm
- Microsoft SQL Server
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Visual Studio or Visual Studio Code

---

## 🗄️ Database Setup

### 1. Start SQL Server
Ensure your local SQL Server instance is running.

### 2. Create the Database
Open SSMS or Azure Data Studio and run:

```sql
CREATE DATABASE TODODB;
```

### 3. Run the Schema Script
Run the following script to create the `Todos` table and index:

```sql
USE [TODODB];
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = N'Todos' AND type = 'U')
BEGIN
    CREATE TABLE dbo.Todos (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        Title       NVARCHAR(150) NOT NULL,
        Description NVARCHAR(500) NULL,
        DueDate     DATETIME2 NOT NULL,
        Priority    NVARCHAR(20) NOT NULL DEFAULT 'Medium',
        Category    NVARCHAR(50) NOT NULL DEFAULT 'Work',
        IsCompleted BIT NOT NULL DEFAULT 0,
        CreatedAt   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt   DATETIME2 NULL
    );
END
GO

-- Index matching filtering and sorting requirements
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Todos_Filters')
BEGIN
    CREATE NONCLUSTERED INDEX IX_Todos_Filters
    ON dbo.Todos (IsCompleted, DueDate, Priority)
    INCLUDE (Title, Description, Category, CreatedAt, UpdatedAt);
END
GO
```

### 4. Configure the Connection String
Open `TodoApi/appsettings.json` and make sure the connection string points to your SQL Server instance:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TODODB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

---

## ▶️ How to Run the Project

### 1. Clone the Repository

```bash
git clone https://github.com/varad-28/TodoAssessment.git
cd TodoAssessment
```

### 2. Run the Backend API

```bash
cd TodoApi
dotnet restore
dotnet run
```

Note the URL and port printed in the console (for example `https://localhost:xxxx`).

### 3. Run the Frontend

Open a **second terminal** from the project root:

```bash
cd TodoFrontend
npm install
npm run dev
```

Then open the URL shown by Vite (by default `http://localhost:5173`) in your browser.

---

## 🔄 Application Architecture

```text
┌─────────────────────┐
│    React Frontend   │
│  JavaScript / Vite  │
└──────────┬──────────┘
           │ HTTP / REST API
           ▼
┌─────────────────────┐
│ ASP.NET Core Web API│
│     C# / .NET 8     │
└──────────┬──────────┘
           │ ADO.NET
           ▼
┌─────────────────────┐
│     SQL Server      │
│       TODODB        │
└─────────────────────┘
```

---

## 📝 Important Notes

- SQL Server must be running before you start the backend API.
- Verify that the connection string in `TodoApi/appsettings.json` matches your local SQL Server instance.
- Run `npm install` inside `TodoFrontend` before starting the client for the first time.
- Verify that the backend base URL configured in the React frontend matches the port shown in the backend console.

---

## 🛠️ Troubleshooting

- **Backend does not start:** Check that the .NET 8 SDK is installed (`dotnet --version`), SQL Server is running, and the `TODODB` database exists.
- **Frontend does not start:** Delete `node_modules`, then run `npm install` followed by `npm run dev`.
- **API connection / CORS error:** Ensure the API is running, CORS allows requests from `http://localhost:5173`, and the frontend API URL matches the backend port.
