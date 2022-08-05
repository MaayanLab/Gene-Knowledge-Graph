### Gene-Centric Knowledge Graph Serializations
| Name                          | Size        | Date Updated | Nodes           |  Edges          | Link | Remarks |
| :---------------------------- | :---------- | :----------- | :-------------- | :-------------- | :--- | :------ |
| drug_and_gene_associations_from_LINCS_serialization        | 88.3MB       | 08/05/2022   | 8942            | 225509            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/sigcom_lincs_serialization.valid.json) | Top up- and down- regulated genes from [LINCS](https://lincsproject.org/) L1000 chemical perturbation signatures |
| tissue-age_gene_associations_from_GTEx_serialization        | 123.5MB       | 08/05/2022   | 18751            | 290926            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/GTEx.valid.json) | Tissue aging signatures taken from [GTEX](https://gtexportal.org/home/) |
| metabolites_gene_associations_from_Metabolomics_serialization        | 2.4MB       | 07/14/2022   | 1743            | 4816            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/metabolomics.valid.json) | Metabolite and gene associations from [Metabolomics Workbench](https://www.metabolomicsworkbench.org/) |
| glycan_and_glycoprotein_associations_from_Glygen_serialization        | 6.9MB       | 07/14/2022   | 3753            | 18571            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/glygen.valid.json) | Glycan and glycoprotein associations from [Glygen](https://www.glygen.org/) |
| tissue-celltype_and_genes_associations_from_HuBMAP_serialization        | 1MB       | 08/05/2022   | 1493            | 2147            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/HuBMAP.valid.json) | Tissue/Cell Type and Genes association from [HuBMAP](https://hubmapconsortium.github.io/ccf-asct-reporter/) |
| Top_150K_BioGRID_associations_serialization        | 82.9MB       | 08/05/2022   | 14088            | 150000            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/biogrid_150K.valid.json) | Top 150K physical and direct associations from [BioGRID](https://thebiogrid.org/) |
| ARCHS4_coexpression_associations        | 75.2MB       | 08/05/2022   | 17966            | 170819            | [link](https://s3.amazonaws.com/maayan-kg/ingestion/biogrid_150K.valid.json) | Tissue/Positively and negatively coexpressed genes from [ARCHS4](https://maayanlab.cloud/ARCHS4) |


### Ingesting data to a neo4j instance

A script for ingesting the above serializations are provided [here](/gene-kg/scripts/populate_from_s3.py).

#### Running the populate script:
1. Download the script from [here](/gene-kg/scripts/populate_from_s3.py).
2. Download `requirements.txt` from [here](/gene-kg/scripts/requirements.txt).
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