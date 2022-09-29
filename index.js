const express = require("express");
const TokenJwt = require("jsonwebtoken");

const app = express();

require('dotenv').config();

app.set("view engine", "ejs");
app.set("views", "./app/views");
app.use(express.static("./app/public"));

//const JWTKey = process.env.JWT;

const JWTKey = '4a04a026-f91b-4a21-90d7-566f4da21fe3';

// código para converter em json
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// banco de dados
const DB = {
    usuarios: [
        {
            id: 1,
            email : 'admin',
            password: 'admin123'
        },
        {
            id: 2,
            email : 'policia',
            password: 'pol456'
        },
        {
            id: 3,
            email : 'alex',
            password: 'alex789'
        },
        {
            id: 4,
            email : 'joao',
            password: 'joao567'
        },
    ]
}

function auth(req, res, next) {
    req.headers.authorization = "bearer " + tokenHeader;
    const authToken = req.headers['authorization'];
    console.log(authToken)

    if(authToken !== undefined) {
        // dividindo o token em duas partes
        const bearer = authToken.split( ' ')
        console.log('BEARER', bearer);

        const token = bearer[1];

        TokenJwt.verify(token, JWTKey, (err, data) => {
            if(err) {
                res.status(401);
                res.json({message: 'ERRO6 - Este Token é inválido'})
            }else {
                console.log(data);
                res.token = token;
                req.loggedUser = { id: data.id, email: data.email };
                console.log("O Usuário foi autorizado!");
                next();
            }
        });
    } else {
        res.status(401);
        res.json({message: 'ERRO7: Esta rota está protegida, não é possível acessar ela no momento'});
    }
}

// portas

app.get("/", (req,res) => {

    res.render("telaLogin");
});

 let tokenHeader = "";
 let dados = "";

app.get("/chat", auth, (req,res) => {

    res.render("chatPolicial", { dados });
})

app.post('/auth', (req, res) => {
    // const { email, password } = req.body;
    // console.log("usuario", req.body)
    const formData = req.body;
    dados = formData;
    const email = formData.email;
    const password = formData.password;

    if (email !== undefined) {
        const user = DB.usuarios.find(u => u.email === email);
        if (user !== undefined) {
            if (user.password === password) {
                // gerando o nosso token assim que o usuario fez login com sucesso
                // as informaçoes do payload do token serão id e email
                // assinatura do token
                TokenJwt.sign({
                    id: user.id,
                    email: user.email,
                }, JWTKey, { // checando  a chave secreta da minha aplicação
                    expiresIn: '1h' // tempo de expiração do token
                }, (err, token) => {
                    if (err) {
                        console.log(err);
                        res.status(400);
                        res.json({ message: 'ERR5: Ops, não foi possível gerar o token' });
                    } else {
                        res.status(200);
                        //res.json({ token });
                        tokenHeader = token;
                        io.emit("messToClient", {
                          email: formData.email,
                          mensagem: "Entrou no chat",
                        });
                        res.redirect("/chat");
                    }
                })
            } else {
                res.status(401)
                res.json({ message: 'ERR2: Email ou password não coincidem.' });
            }
        } else {
            res.status(404),
                res.json({ message: 'ERR3: Ops, usuario não existe.' })
        }
    } else {
        res.status(400);
        res.json({ message: 'ERR1: Email ou password não podem ser nulos.' })
    }
});


const xpto = app.listen(5000, () => {
    console.log('Está funcionando aqui => http://localhost:5000');
  });



const io = require("socket.io")(xpto);

io.on("conection", (socket) => {
    console.log("Entrou na sala"); 

    socket.on("disconnect", () => {
        console.log("Saiu da sala");
    });

    socket.on("iniciaChat", (data) => {
        socket.emit("showMessage", {
            email: data.email,
            mensagem: data.mensagem,
        });

        socket.broadcast.emit("showMessage", {
            email: data.email,
            mensagem: data.mensagem,
        });
    });
});