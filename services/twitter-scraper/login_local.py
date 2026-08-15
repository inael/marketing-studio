"""Rode NA SUA MAQUINA (nao na VPS): pip install twikit
Faz o login no X e gera cookies.json. Se o X pedir o codigo do email, o twikit
pede aqui no terminal — cole o codigo. Depois copie o conteudo do cookies.json
pro campo 'Cookies' no Config do Marketing Studio."""
import asyncio
from getpass import getpass

from twikit import Client


async def main() -> None:
    u = input("Usuario X (sem @): ").strip()
    e = input("Email da conta: ").strip()
    p = getpass("Senha: ").strip()
    client = Client("en-US")
    await client.login(auth_info_1=u, auth_info_2=e, password=p)
    client.save_cookies("cookies.json")
    print("\nOK! cookies.json gerado nesta pasta.")
    print("Cole TODO o conteudo abaixo no campo 'Cookies' do Config:\n")
    with open("cookies.json", encoding="utf-8") as f:
        print(f.read())


if __name__ == "__main__":
    asyncio.run(main())
