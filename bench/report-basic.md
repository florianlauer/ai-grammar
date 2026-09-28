# Grammar benchmark: basic

| Model | Fully fixed | Checks passed | Median latency |
|---|---|---|---|
| gemma4:e2b-it-qat | 14/14 | 100% | 0.40s |
| llama3.1 | 11/14 | 94% | 0.87s |
| qwen3.5:4b | 11/14 | 92% | 0.82s |
| gemma3:4b | 11/14 | 88% | 0.68s |
| qwen3:4b-instruct | 8/14 | 82% | 0.51s |
| ministral-3:3b | 8/14 | 76% | 0.45s |

### 1. `jecris un grand texte mais j'ai pas mal la flemme de fair des effort`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | J'écris un grand texte mais j'ai pas mal la flemme de faire des efforts | ✓ |
| qwen3.5:4b | J'écris un grand texte, mais j'ai pas mal la flemme de faire des efforts. | ✓ |
| gemma3:4b | Je crée un grand texte, mais j'ai pas mal la flemme de faire des efforts. | ✗ missing /^J['’]écris/ |
| qwen3:4b-instruct | Je cris un grand texte mais j'ai pas mal la flemme de faire des effort | ✗ missing /^J['’]écris/, missing /faire des efforts/ |
| ministral-3:3b | J'écris un grand texte, mais je n'ai pas beaucoup la flemme de faire des efforts. | ✗ missing /pas mal la flemme/, forbidden /n['’]ai pas/ |
| llama3.1 | je crée un grand texte mais j'ai pas mal la flemme de faire des efforts | ✗ missing /^J['’]écris/ |

### 2. `je sais pas si tu a recu mon mail d'hier, je te le renvoi`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je ne sais pas si tu as reçu mon mail d'hier, je te le renvoie. | ✓ |
| qwen3.5:4b | Je ne sais pas si tu as reçu mon e-mail d'hier, je te le renvoie. | ✓ |
| gemma3:4b | Je sais pas si tu as reçu mon mail d'hier, je te le renvoie. | ✓ |
| qwen3:4b-instruct | Je sais pas si tu as reçu mon mail d'hier, je te le renvoie. | ✓ |
| ministral-3:3b | Je ne sais pas si tu as reçu mon email d’hier, je te le renvoie. | ✓ |
| llama3.1 | Je sais pas si tu as reçu mon mail d'hier, je te le renvoie | ✓ |

### 3. `on c'est vu hier soir et on a parler du projet`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | On s'est vu hier soir et on a parlé du projet | ✓ |
| qwen3.5:4b | On c'est vu hier soir et on a parlé du projet. | ✗ missing /s['’]est vus?/ |
| gemma3:4b | On s’est vu hier soir et on a parlé du projet | ✓ |
| qwen3:4b-instruct | On a vu hier soir et on a parlé du projet. | ✗ missing /s['’]est vus?/ |
| ministral-3:3b | On a vu hier soir et on a parlé du projet. | ✗ missing /s['’]est vus?/ |
| llama3.1 | On l'a vu hier soir et on a parlé du projet | ✗ missing /s['’]est vus?/ |

### 4. `il faut que tu vien demain a la reunion`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Il faut que tu viennes demain à la réunion | ✓ |
| qwen3.5:4b | Il faut que tu viennes demain à la réunion. | ✓ |
| gemma3:4b | Il faut que tu viennes demain à la réunion. | ✓ |
| qwen3:4b-instruct | Il faut que tu viennes demain à la réunion. | ✓ |
| ministral-3:3b | Il faut que tu viennes demain à la réunion. | ✓ |
| llama3.1 | il faut que tu viennes demain à la réunion | ✓ |

### 5. `les resultats que j'ai obtenu sont meilleur que prevu`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Les résultats que j'ai obtenus sont meilleurs que prévu. | ✓ |
| qwen3.5:4b | Les résultats que j'ai obtenus sont meilleurs que prévus. | ✓ |
| gemma3:4b | Les résultats que j'ai obtenus sont meilleurs que prévu. | ✓ |
| qwen3:4b-instruct | Les résultats que j'ai obtenus sont meilleurs que prévu. | ✓ |
| ministral-3:3b | Les résultats que j’ai obtenus sont meilleurs que prévu. | ✓ |
| llama3.1 | les résultats que j'ai obtenus sont meilleurs que prévus | ✓ |

### 6. `Je pense quil faudrait deployer la nouvelle version avant vendredi`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je pense qu'il faudrait déployer la nouvelle version avant vendredi | ✓ |
| qwen3.5:4b | Je pense qu'il faudrait déployer la nouvelle version avant vendredi. | ✓ |
| gemma3:4b | Je pense qu'il faudrait déployer la nouvelle version avant vendredi. | ✓ |
| qwen3:4b-instruct | Je pense qu'il faudrait déployer la nouvelle version avant vendredi. | ✓ |
| ministral-3:3b | Je pense qu’il faudrait déployer la nouvelle version avant vendredi. | ✓ |
| llama3.1 | Je pense qu'il faudrait déployer la nouvelle version avant vendredi. | ✓ |

### 7. `ces vrai que sa marche mieux maintenant`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | C'est vrai que ça marche mieux maintenant | ✓ |
| qwen3.5:4b | C'est vrai que ça marche mieux maintenant. | ✓ |
| gemma3:4b | C'est vrai que ça marche mieux maintenant. | ✓ |
| qwen3:4b-instruct | Ces v vrai que sa marche mieux maintenant | ✗ missing /^C['’]est vrai/, missing /ça marche/ |
| ministral-3:3b | C’est vrai que ça marche mieux maintenant. | ✓ |
| llama3.1 | c'est vrai que sa marche s'est améliorée maintenant | ✗ missing /ça marche/ |

### 8. `Merci pour ton aide, sa ma vraiment aidé a avancé`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Merci pour ton aide, ça m'a vraiment aidé à avancer. | ✓ |
| qwen3.5:4b | Merci pour ton aide, ça m'a vraiment aidé à avancer. | ✓ |
| gemma3:4b | Merci pour ton aide, ça m'a vraiment aidé à avancer. | ✓ |
| qwen3:4b-instruct | Merci pour ton aide, c'est vraiment aidé à avancer. | ✗ missing /ça m['’]a/ |
| ministral-3:3b | Merci pour ton aide, ça m’a vraiment aidé à avancer. | ✓ |
| llama3.1 | Merci pour ton aide, ça m'a vraiment aidé à avancer | ✓ |

### 9. `Le déploiement est prévu pour jeudi prochain.`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Le déploiement est prévu pour jeudi prochain. | ✓ |
| qwen3.5:4b | Le déploiement est prévu pour jeudi prochain. | ✓ |
| gemma3:4b | Le déploiement est prévu pour jeudi prochain. | ✓ |
| qwen3:4b-instruct | Le déploiement est prévu pour jeudi prochain. | ✓ |
| ministral-3:3b | Le déploiement est prévu pour le jeudi prochain. | ✗ changed a correct text |
| llama3.1 | Le déploiement est prévu pour jeudi prochain. | ✓ |

### 10. `jai push la PR sur github, tu peut la review quand tu a le temps`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | J'ai push la PR sur GitHub, tu peux la reviewer quand tu as le temps | ✓ |
| qwen3.5:4b | J'ai poussé la PR sur GitHub, tu peux la reviewer quand tu as le temps. | ✗ missing /^J['’]ai push/, forbidden /pouss\|examin\|révis\|relire/ |
| gemma3:4b | J'ai poussé la PR sur GitHub, tu peux la revoir quand tu en a le temps. | ✗ missing /^J['’]ai push/, missing /tu as le temps/, missing /review/, forbidden /pouss\|examin\|révis\|relire/ |
| qwen3:4b-instruct | J'ai poussé la PR sur GitHub, tu peux la reviewer quand tu as le temps. | ✗ missing /^J['’]ai push/, forbidden /pouss\|examin\|révis\|relire/ |
| ministral-3:3b | J’ai poussé la PR sur GitHub, tu peux la **revoir** quand tu en as le temps. | ✗ missing /^J['’]ai push/, missing /tu as le temps/, missing /review/, forbidden /pouss\|examin\|révis\|relire/, forbidden /\*\*/ |
| llama3.1 | j'ai pushé la PR sur GitHub, tu peux la review quand tu as le temps | ✓ |

### 11. `je vais au suppermarché achter du pain`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je vais au supermarché acheter du pain | ✓ |
| qwen3.5:4b | Je vais au supermarché acheter du pain. | ✓ |
| gemma3:4b | Je vais au supermarché acheter du pain | ✓ |
| qwen3:4b-instruct | Je vais au supermarché acheter du pain. | ✓ |
| ministral-3:3b | je vais au supermarché **acheter** du pain. | ✗ forbidden /\*\*/ |
| llama3.1 | je vais au supermarché acheter du pain | ✓ |

### 12. `I has went to the store yesterday and buyed some apple`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | I went to the store yesterday and bought some apples. | ✓ |
| qwen3.5:4b | I have gone to the store yesterday and bought some apples. | ✗ missing /I went/ |
| gemma3:4b | I have went to the store yesterday and bought some apples. | ✗ missing /I went/ |
| qwen3:4b-instruct | I had gone to the store yesterday and bought some apples. | ✗ missing /I went/ |
| ministral-3:3b | I **went** to the store yesterday and **bought** some apples. | ✗ missing /I went/, forbidden /\*\*/ |
| llama3.1 | I went to the store yesterday and bought some apples. | ✓ |

### 13. `Could you plese send me the reprot before tomorow?`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Could you please send me the report before tomorrow? | ✓ |
| qwen3.5:4b | Could you please send me the report before tomorrow? | ✓ |
| gemma3:4b | Could you please send me the report before tomorrow? | ✓ |
| qwen3:4b-instruct | Could you please send me the report before tomorrow? | ✓ |
| ministral-3:3b | Could you please send me the report before tomorrow? | ✓ |
| llama3.1 | Could you please send me the report before tomorrow? | ✓ |

### 14. `The meeting is scheduled for next Thursday.`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | The meeting is scheduled for next Thursday. | ✓ |
| qwen3.5:4b | The meeting is scheduled for next Thursday. | ✓ |
| gemma3:4b | The meeting is scheduled for next Thursday. | ✓ |
| qwen3:4b-instruct | The meeting is scheduled for next Thursday. | ✓ |
| ministral-3:3b | The meeting is scheduled for next Thursday. | ✓ |
| llama3.1 | The meeting is scheduled for next Thursday. | ✓ |
