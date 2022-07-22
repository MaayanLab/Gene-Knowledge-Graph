### Reprotox Knowledge Graph Serializations
| Name                          | Size        | Date Updated | Nodes           |  Edges          | Link | Remarks |
| :---------------------------- | :---------- | :----------- | :-------------- | :-------------- | :--- | :------ |
| drug_and_gene_birth-defects-associations_serialization        | 1.4MB       | 07/12/2022   | 1433            | 2252            | [link](https://s3.amazonaws.com/maayan-kg/reprotox/reprotox_serialization.valid.json) | Associations from [DrugShot](https://maayanlab.cloud/drugshot/), [DrugEnrichr](https://maayanlab.cloud/DrugEnrichr/), and [GeneShot](https://maayanlab.cloud/GeneShot/) |
| drug_and_gene_associations_from_lincs_serialization    | 18.1MB      | 07/12/2022 | 6523 | 43998 | [link](https://s3.amazonaws.com/maayan-kg/reprotox/sigcom_lincs_serialization.valid.json) | Top up- and down- regulated genes from [LINCS](https://maayanlab.cloud/sigcom-lincs/) L1000 chemical perturbation signatures |
| drug_and_birth-defects_associations_from_FAERS_male_serialization            | 103KB       | 07/12/2022 | 117  | 179   | [link](https://s3.amazonaws.com/maayan-kg/reprotox/drugsto_faers_male.valid.json) | Drug/Birth Defect associations extracted from the FAERS database by IDG |
| drug_and_birth-defects_associations_from_FAERS_female_serialization          | 111KB       | 07/12/2022 | 126  | 193   | [link](https://s3.amazonaws.com/maayan-kg/reprotox/drugsto_faers_female.valid.json) | Drug/Birth Defect associations extracted from the FAERS database by IDG |

### Ingesting data to a neo4j instance

A script for ingesting the above serializations are provided [here](/CFDE-KX/scripts/populate_from_s3.py).

#### Running the populate script:
1. Download the script from [here](/CFDE-KX/scripts/populate_from_s3.py).
2. Download `requirements.txt` from [here](/CFDE-KX/scripts/requirements.txt).
3. `pip install requirements.txt`
4. Create a `.env` file and edit the following variables:
   ```
    # .env
    NEO4J_URL=neo4j://localhost:7687
    NEO4J_USER=neo4j
    NEO4J_NAME=reprotox
    NEO4J_PASSWORD=mysecretpassword
   ```
5. run `python populate_from_s3.py`