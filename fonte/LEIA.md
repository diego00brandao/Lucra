# Código-fonte do Lucra

O `index.html` publicado é gerado pelo `build.py` a partir de:
- `base-original.html`: a primeira versão do app;
- `patches*.py`: trocas no código, aplicadas em ordem;
- `*.js`, `body.html` e `style.css`: módulos injetados.

Os testes `teste*.py` usam Playwright. O `teste12.py` simula o Supabase.
O banco fica em `../supabase/schema.sql`.
