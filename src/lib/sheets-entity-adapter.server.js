import { createSheetRecord, deleteSheetRecord, listSheetRecords, updateSheetRecord } from "@/lib/google-sheets.server";

// Keep the legacy server-function API stable while moving persistence to Sheets.
const ENTITY_TABS = {
  Event: "Event", EventMember: "EventMember", ScheduleItem: "ScheduleItem",
  Collection: "Collection", Look: "Look", LookAssignment: "LookAssignment",
  HairMakeup: "HairMakeup", ShowSegment: "ShowSegment", Announcement: "Announcement",
  Notification: "Notification", ReadinessTask: "ReadinessTask", AuditLog: "AuditLog",
  DesignerProfile: "DesignerProfile", Opportunity: "Opportunity", Application: "Application",
  User: "User",
};

const makeId = () => crypto.randomUUID();
const matches = (row, filter = {}) => Object.entries(filter).every(([key, value]) => {
  if (value === undefined || value === null) return true;
  return row?.[key] === value;
});

function entity(tab) {
  const all = async () => listSheetRecords(tab);
  return {
    list: async (options = {}) => {
      let rows = await all();
      if (options.sort) {
        const desc = options.sort.startsWith("-");
        const key = desc ? options.sort.slice(1) : options.sort;
        rows.sort((a, b) => String(a[key] || "").localeCompare(String(b[key] || "")) * (desc ? -1 : 1));
      }
      return options.limit ? rows.slice(0, options.limit) : rows;
    },
    filter: async (where = {}, options = {}) => {
      let rows = (await all()).filter((row) => matches(row, where));
      if (options.limit) rows = rows.slice(0, options.limit);
      return rows;
    },
    get: async (id) => {
      const row = (await all()).find((item) => String(item.id) === String(id));
      if (!row) throw Object.assign(new Error(`${tab} record not found`), { status: 404 });
      return row;
    },
    create: async (record) => {
      const now = new Date().toISOString();
      return createSheetRecord(tab, { id: record.id || makeId(), ...record, created_date: record.created_date || now, updated_date: now });
    },
    bulkCreate: async (records) => Promise.all(records.map((record) => entity(tab).create(record))),
    update: async (id, record) => updateSheetRecord(tab, id, { ...record, updated_date: new Date().toISOString() }),
    delete: async (id) => deleteSheetRecord(tab, id),
    deleteMany: async (where = {}) => {
      const rows = (await all()).filter((row) => matches(row, where));
      await Promise.all(rows.map((row) => deleteSheetRecord(tab, row.id)));
      return { deleted: rows.length };
    },
  };
}

export function createSheetsService(user) {
  const entities = Object.fromEntries(Object.entries(ENTITY_TABS).map(([name, tab]) => [name, entity(tab)]));
  return {
    auth: { me: async () => user },
    entities,
    asServiceRole: { entities },
  };
}
