# Projeto DropBox Clone - JavaScript - Eraldo Carlos

### Projeto

[![DropBox Clone](https://camo.githubusercontent.com/1994b4521e0baafc06a1b96b4bef280448330e5d062e9f108e35f73bcde148b8/68747470733a2f2f666972656261736573746f726167652e676f6f676c65617069732e636f6d2f76302f622f68636f64652d636f6d2d62722e61707073706f742e636f6d2f6f2f44726f70426f78436c6f6e652e6a70673f616c743d6d6564696126746f6b656e3d64353963616430632d343430642d343531362d383866322d646139303462396262343433)](https://camo.githubusercontent.com/1994b4521e0baafc06a1b96b4bef280448330e5d062e9f108e35f73bcde148b8/68747470733a2f2f666972656261736573746f726167652e676f6f676c65617069732e636f6d2f76302f622f68636f64652d636f6d2d62722e61707073706f742e636f6d2f6f2f44726f70426f78436c6f6e652e6a70673f616c743d6d6564696126746f6b656e3d64353963616430632d343430642d343531362d383866322d646139303462396262343433)

## Processos para rodar Aplicação

### **Backend** 

Neste projeto está sendo utilizado **RealTime Database do Firebase** para salvar as referências dos arquivos, os arquivos estão sendo armazenados no **Storage do Firabese** em nuvem, para poder utilizar a palicação e necessário a criação de um Projeto no FIrebase e em seguida criar o RealTime Database e adicionar os dados da conexão no metodo **connectFirebase()** que fica no arquivo **DropBoxController.js** localizado em **src/controller/DropBoxController.js**, também crie a sua **Storage no Firebase** e edite a regra por está logo abaixo.

 service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write;
    }
  }
} 

### **Frontend**

Após efetuar o Clone do Projeto pelo git, acesse a pasta do Projeto e inicie o diretório no visual code, feito isto digite o comando **npm install** ou **npm i** para baixar as bibliotecas e dependências do projeto, neste projeto também está sendo utilizado o bower então se não tiver o bower instaldo execute o comando **npm install bower** e após isto **bower install**,  finalizado este processo inicie a aplicação com o comando **npm start**.

