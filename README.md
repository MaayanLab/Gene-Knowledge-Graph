## Getting Started with KG-UI

This knowledge graph UI interface serves as a front end for a Neo4j knowledge graph database. For information on setting up the user interface, see [here](https://github.com/MaayanLab/KnowledgeGraphUIDemo)

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
