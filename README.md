## Getting Started with KG-UI

KG-UI is a knowledge graph user interface that can be served as a frontend for Neo4j knowledge graph databases bioinformatics applications. Below is a set of Jupyter notebooks to guide you through the process:

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

helm template <name> maayanlab/docker-compose -f <(docker-compose config) -n <name> 


## Legacy Version
```
docker-compose -f docker-compose-legacy.yml build
```

## Customizing the UI
For more information about customizing the user interface, see examples from this [repo](https://github.com/MaayanLab/KnowledgeGraphUIDemo).

## video tutorials

[![Part 1 - Knowledge Graphs](h[https://i9.ytimg.com/vi_webp/7DjbXfvWL9o/mqdefault.webp?v=66037e29&sqp=CICC78MG&rs=AOn4CLDUZZgZo_Dc-8po1z1HovRyLsQ7cA])([[https://www.youtube.com/watch?v=7DjbXfvWL9o](https://www.youtube.com/watch?v=7DjbXfvWL9o)]

