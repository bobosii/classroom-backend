import { relations } from "drizzle-orm";
import { pgTable, integer, varchar, timestamp } from "drizzle-orm/pg-core";

const timeStamps = {
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
};

export const departments = pgTable('departments', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    ...timeStamps
})

export const subjects = pgTable('subjects', {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    departmentId: integer('department_id').notNull().references(() => departments.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: varchar('description', { length: 255 }),
    ...timeStamps
})

export const departmentRelations = relations(departments, ({ many }) => ({ subjects: many(subjects) }));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
    department: one(departments, {
        fields: [subjects.departmentId],
        references: [departments.id],
    })
}
));
// Departments
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

// Subjects
export type Subjects = typeof subjects.$inferSelect;
export type NewSubjects = typeof subjects.$inferInsert;
