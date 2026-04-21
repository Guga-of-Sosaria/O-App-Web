Um app web com firebase integrado feito para uma atividade da matéria de modelagem de dados do curso de ciência da computação da UNIMA

# Estrutura do realtime database
```
firebase-rtdb
├── users
│   └── {$uid}
│       ├── username
│       ├── email
|		├── avatar
│       ├── role
|       └── user-posts
|           └──{$pid}
│               ├── author
│               ├── avatar
│               ├── postText
|               └── uid
|                 
│   
├── admin-data
|   └── banned-users
|       └──{$uid}
|           ├── banReason
|           └── username
└── posts           └──{$pid}
    ├── author
    ├── avatar
    ├── postText
    └── uid

```

# Estrutura das regras de segurança do realtime database

```

{
  "rules": {
    ".read": "auth != null",
    ".write": false,
		
    "users": {
      ".read": "auth != null",
      ".write": "auth != null",
        "$uid": {
          ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'", 
        	".write": "auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'",
        },
    },
    
    "admin-data": {
      ".read": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".write": "root.child('users').child(auth.uid).child('role').val() === 'admin'",
        
    },
    
    "user-posts": {
      "$uid": {
        ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'", 
        ".write": "auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin'"
      },
    },
    
    "posts": {
    	".read": "auth != null && root.child('users').child(auth.uid).child('role').val() != 'banned'",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() != 'banned'"
    }
      
    
  }
}

```

# Como Rodar o Código

## Pré-requisitos
- Node.js e npm instalados em sua máquina
- Acesso à internet para comunicação com Firebase

## Passos para Executar

### 1. Instalar as Dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```
Este comando irá instalar todas as dependências listadas no `package.json`, incluindo Firebase e Parcel.

### 2. Iniciar o Servidor de Desenvolvimento
Para rodar a aplicação em modo desenvolvimento, execute:
```bash
npm start
```

O Parcel irá compilar e servir a aplicação. A aplicação abrirá automaticamente no navegador, geralmente em `http://localhost:1234`.

### 3. Acessar a Aplicação
- Abra seu navegador e vá para `http://localhost:1234`
- Crie uma nova conta ou faça login com suas credenciais
- Comece a usar a plataforma!

## Build para Produção
Se quiser criar uma versão otimizada para produção, execute:
```bash
npm build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

