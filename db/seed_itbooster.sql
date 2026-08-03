insert into brands (slug, nome, cor_principal, cor_apoio, fonte, tom_voz, site_url)
values ('itbooster','IT Booster','#9333ea', array['#60a5fa','#020015'], 'Inter',
        'tech, direto, foco em acelerar vendas', 'https://itbooster.com.br')
on conflict (slug) do nothing;
