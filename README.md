## Getting Started with KG-UI

KG-UI is a knowledge graph user interface that can be used as a frontend for Neo4j knowledge graph databases bioinformatics applications. Below is a set of Jupyter notebooks to guide you through the process:

* [Introduction to Cypher](https://github.com/MaayanLab/KnowledgeGraphUIDemo/blob/main/notebooks/cypher.ipynb)
* [Creating assertions and ingesting them into Neo4j](https://github.com/MaayanLab/KnowledgeGraphUIDemo/blob/main/notebooks/serialization.ipynb)
* [Setting up the UI](https://github.com/MaayanLab/KnowledgeGraphUIDemo/blob/main/notebooks/setting_up_ui.ipynb)

To run the interface locally, run the following commands:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

```
npm version <major/minor/patch>
```
## Kubernetes installation

### Install
helm install <name> maayanlab/docker-compose -f <(docker-compose config) -n <name> --create-namespace 

### Upgrade
helm upgrade <name> maayanlab/docker-compose -f <(docker-compose config) -n <name> 

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
# CFDE-KX

## Install
helm install distillery maayanlab/docker-compose -f <(docker-compose config) -n distillery --create-namespace 

## UPGRADE
helm upgrade distillery maayanlab/docker-compose -f <(docker-compose config) -n distillery 

helm template distillery maayanlab/docker-compose -f <(docker-compose config) -n distillery 


## Legacy Version
```
docker-compose -f docker-compose-legacy.yml build
```

## Customizing the UI
For more information about customizing the user interface, see examples from this [repo](https://github.com/MaayanLab/KnowledgeGraphUIDemo).

## video tutorials

[![Part 1 - Knowledge Graphs](https://i9.ytimg.com/vi_webp/7DjbXfvWL9o/mqdefault.webp?v=66037e29&sqp=CICC78MG&rs=AOn4CLDUZZgZo_Dc-8po1z1HovRyLsQ7cA)](https://www.youtube.com/watch?v=7DjbXfvWL9o)
[![Part 2 - Neo4j](https://i9.ytimg.com/vi/Vb3DyaauZtM/mqdefault.jpg?v=66037f5d&sqp=COii78MG&rs=AOn4CLCqwcK4ULC5VkmyZX-ghIg1R97PdQ)](https://youtu.be/Vb3DyaauZtM)
[![Part 3 - Serialization](https://i9.ytimg.com/vi_webp/u8l__O6AUWo/mqdefault.webp?v=660382a3&sqp=CJSl78MG&rs=AOn4CLDei_1KFDXIkpJt8-AWRpa-MnPtEg)](https://youtu.be/u8l__O6AUWo)
[![Part 4 - Cypher](https://i9.ytimg.com/vi/DhM3XepF5NI/mqdefault.jpg?v=660383aa&sqp=CJSl78MG&rs=AOn4CLDdXtAOQrmLVeTiAwpQ3johyACYIA)](https://youtu.be/DhM3XepF5NI)
[![Part 5 - Setting Up UI](https://i9.ytimg.com/vi/ydPR7wgcl0U/mqdefault.jpg?v=66038670&sqp=CMCn78MG&rs=AOn4CLBROjFzSr4Antik4coSnUQklYtAgw)](https://youtu.be/ydPR7wgcl0U)
