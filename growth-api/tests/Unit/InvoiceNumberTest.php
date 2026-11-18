<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/** Invoice numbers, the Indian financial year, amounts in words and billing dates. */
final class InvoiceNumberTest extends TestCase
{
    public function testFinancialYearStartsInApril(): void
    {
        $this->assertSame('25-26', financial_year('2026-03-31'));
        $this->assertSame('26-27', financial_year('2026-04-01'));
        $this->assertSame('99-00', financial_year('2099-12-31'));
    }

    public function testNumberFormatWithAndWithoutFinancialYear(): void
    {
        $this->assertSame('INV/26-27/0001', format_doc_number('INV', true, '2026-11-18', 1));
        $this->assertSame('INV/25-26/0042', format_doc_number('INV', true, '2026-01-10', 42));
        $this->assertSame('CN/0007', format_doc_number('CN', false, '2026-11-18', 7));
    }

    public function testAmountInWordsUsesIndianGrouping(): void
    {
        $this->assertSame('Rupees One Lakh Eighteen Thousand Only', amount_in_words(118000, 'INR'));
        $this->assertSame('Rupees Eleven Thousand Eight Hundred and Fifty Paise Only', amount_in_words(11800.50, 'INR'));
    }

    public function testMonthlyBillingKeepsTheBillingDay(): void
    {
        $this->assertSame('2026-02-28', add_months('2026-01-31', 1));
        $this->assertSame('2026-03-31', add_months('2026-02-28', 1, 31));
        $this->assertSame('2027-01-15', add_months('2026-10-15', 3));
    }

    public function testCsvExportCannotRunSpreadsheetFormulas(): void
    {
        $this->assertSame(["'=SUM(A1:A9)", "'+91 94002 30723", 'Plain', -5, '-5'], csv_safe(['=SUM(A1:A9)', '+91 94002 30723', 'Plain', -5, '-5']));
    }
}
