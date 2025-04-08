# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Alien%20Monster.png" alt="Alien Monster" width="25" height="25" /> ft_transcendence

<div align=center>
  
  ![badge](https://raw.githubusercontent.com/angelamcosta/angelamcosta/main/42_badges/ft_transcendencen.png)

  <table>
  <tr>
    <td align="center"><a href="https://github.com/angelamcosta"><img src="https://avatars.githubusercontent.com/u/14792447?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Angela Lima</b></sub></a><br /><a href="https://github.com/angelamcosta" title="Angela Lima"></a></td>
    <td align="center"><a href="https://github.com/gcssilva"><img src="https://avatars.githubusercontent.com/u/108615291?v=4" width="100px;" alt=""/><br /><sub><b>Gustavo Silva</b></sub></a><br /><a href="https://github.com/gcssilva" title="Gustavo Silva"></a></td>
    <td align="center"><a href="http://github.com/mgdiogo"><img src="https://avatars.githubusercontent.com/u/109535612?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Miguel Diogo</b></sub></a><br /><a href="https://github.com/mgdiogo/" title="Miguel Diogo"></a></td>
    <td align="center"><a href="http://github.com/Vasco23"><img src="https://cdn.intra.42.fr/users/a5168643884fed14a9997fd95c6c4263/vcacador.jpg" height="100px;" alt=""/><br /><sub><b>Vasco Caçador</b></sub></a><br /><a href="https://github.com/Vasco23/" title="Vasco Caçador"></a></td>
  </tr>
</table>

[![My Skills](https://skillicons.dev/icons?i=bootstrap,docker,nodejs,ts,sqlite,bash&theme=dark)](https://skillicons.dev)


[![forthebadge](https://forthebadge.com/images/badges/docker-container.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/made-with-love__.svg)](https://forthebadge.com) [![forthebadge](https://forthebadge.com/images/badges/made-with-typescript.svg)](https://forthebadge.com) 

</div>

<div align=center>

  <img alt="GitHub Language Count" src="https://img.shields.io/github/languages/count/angelamcosta/ft_transcendence" /> <img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/angelamcosta/ft_transcendence" /> <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/angelamcosta/ft_transcendence" /> <img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/angelamcosta/ft_transcendence" /> <img alt="Github License" src="https://img.shields.io/github/license/angelamcosta/ft_transcendence" /> <a href="https://wakatime.com/badge/user/0c29d5b3-c30b-4e1a-ad07-2da3bd4f7e05/project/ae9b77b3-210d-4f50-a73b-4cf4ac753c11"><img src="https://wakatime.com/badge/user/0c29d5b3-c30b-4e1a-ad07-2da3bd4f7e05/project/ae9b77b3-210d-4f50-a73b-4cf4ac753c11.svg" alt="wakatime"></a>

</div>

This project is about creating a website for the mighty Pong contest! The subject of the project can be found [here](https://raw.githubusercontent.com/angelamcosta/ft_transcendence/main/en.subject.pdf).

## Minimal technical requirement

> [!IMPORTANT]  
> Some of these contraints could be overriden by the choice of specific modules.

The project must comply with the following rules:

- Development of the site can be done with or without a backend.
  - If a backend is included, it must be written in pure PHP, unless overridden by the [Framework module](#web).
  - If a backend or framework uses a database, the constraints of the [Database module](#web) must be followed.
- The frontend should be developed using Typescript, unless altered through the [FrontEnd module](#web).
- The website must be a single-page application, allowing the use of the Back and Forward buttons in the browser.
- Compatibility with the latest stable version of _Google Chrome_ is required.
- Users should not encounter any unhandled errors or warnings while browsing the website.
- The entire project must be launched with a single command line to run an autonomous container provided by Docker. Example: `docker-compose up --build` or `make`.

## Modules

To attain 100% project completion, a minimum of 7 major modules is required. Two Minor Modules are equivalent to one Major Module.

### Web
- [x] Major module: Use a Framework as backend.
    - Fastify with Node.js.
- [x] Minor module: Use a front-end framework or toolkit.
    - Tailwind CSS
- [x] Minor module: Use a database for the backend.
    -  SQLite 
- [ ] Major module: Store the score of a tournament in the Blockchain.

### User Management
- [x] Major module: Standard user management, authentication, users across tournaments.
- [ ] Major module: Implementing a remote authentication.

### Gameplay and User Experience
- [ ] Major module: Remote players.
- [ ] Major module: Multiplayers (more than 2 in the same game).
- [ ] Major module: Add Another Game with User History and Matchmaking.
- [ ] Minor module: Game Customization Options.
- [ ] Major module: Live chat.

### AI-Algo
- [ ] Major module: Introduce an AI Opponent.
- [ ] Minor module: User and Game Stats Dashboards.

### Cybersecurity
- [ ] Major module: Implement WAF/ModSecurity with Hardened Configuration and HashiCorp Vault for Secrets Management.
- [ ] Minor module: GDPR Compliance Options with User Anonymization, Local Data Management, and Account Deletion.
- [x] Major module: Implement Two-Factor Authentication (2FA) and JWT.

### Devops
- [ ] Major module: Infrastructure Setup for Log Management.
- [ ] Minor module: Monitoring system.
- [x] Major module: Designing the Backend as Microservices.

### Graphics
- [ ] Major module: Use of advanced 3D techniques.

### Accessibility
- [ ] Minor module: Support on all devices.
- [ ] Minor module: Expanding Browser Compatibility.
- [ ] Minor module: Multiple language supports.
- [ ] Minor module: Add accessibility for Visually Impaired Users.
- [ ] Minor module: Server-Side Rendering (SSR) Integration.

### Server-Side Pong
- [ ] Major module: Replacing Basic Pong with Server-Side Pong and Implementing an API.
- [ ] Major module: Enabling Pong Gameplay via CLI against Web Users with API Integration.

## References
- [Fastify - Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/)
- [Token based authentication with Fastify, JWT, and Typescript](https://medium.com/@atatijr/token-based-authentication-with-fastify-jwt-and-typescript-1fa5cccc63c5)
- [Password Hashing & Salting - Function and Algorithm Explained](https://www.authgear.com/post/password-hashing-salting-function-and-algorithm-explained)
- [Fastiy Documentation](https://fastify.dev/docs/latest/)