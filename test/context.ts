/*
    context.ts - Test context APIs
 */
import {AWS, Client, Match, Table, print, dump, delay} from './utils/init'
import {TenantSchema} from './schemas'

jest.setTimeout(7200 * 1000)

const table = new Table({
    name: 'ContextTestTable',
    client: Client,
    schema: TenantSchema,
    uuid: 'ulid',
    logger: true,
})
const accountId = table.uuid()

test('Create table', async() => {
    if (!(await table.exists())) {
        await table.createTable()
        expect(await table.exists()).toBe(true)
    }
})

let User = table.getModel('User')
let Account = table.getModel('Account')
let account: any
let user: any
let users: any[]

let data = [
    {name: 'Peter Smith', email: 'peter@example.com' },
    {name: 'Patty O\'Furniture', email: 'patty@example.com' },
    {name: 'Cu Later', email: 'cu@example.com' },
]

test('Create account', async() => {
    account = await Account.create({name: 'Acme'})
    expect(account.name).toBe('Acme')
    expect(account.id).toMatch(Match.ulid)
    expect(account._type).toBe('Account')
})

test('Set context', async() => {
    table.setContext({accountId: account.id})
})

test('Create users', async() => {
    for (let item of data) {
        //  Account ID comes from context
        user = await User.create(item)
        expect(user).toMatchObject(item)
        expect(user.id).toMatch(Match.ulid)
        expect(user.accountId).toBe(account.id)
    }
    users = await User.scan()
    expect(users.length).toBe(data.length)
})

test('Get users', async() => {
    //  PK comes from context
    users = await User.find()
    expect(users.length).toBe(data.length)
})

test('Remove many users', async() => {
    //  PK comes from context
    await User.remove({}, {many: true})
    users = await User.scan()
    expect(users.length).toBe(0)
})

test('Clear context', async() => {
    //  PK comes from context
    let context = table.getContext()
    expect(context).toMatchObject({accountId: account.id})

    table.clearContext()
    context = table.getContext()
    expect(context).toMatchObject({})
})

test('Destroy Table', async() => {
    await table.deleteTable('DeleteTableForever')
    expect(await table.exists()).toBe(false)
})
